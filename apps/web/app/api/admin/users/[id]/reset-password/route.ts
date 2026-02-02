import { createHash, randomBytes, randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma, logAuditEvent } from "@ebv/db";
import { getAuthFromRequest, requireRole } from "@ebv/auth";
import { buildAuditMetadata } from "@/lib/audit";
import { sendMailWithAudit } from "@/lib/mail-audit";

export const runtime = "nodejs";

const DEFAULT_TTL_MINUTES = 60;

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function generateCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(req);
  const guard = requireRole(auth, ["ADMIN"]);
  if (guard) return guard;
  const actor = auth?.user;
  if (!actor) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const ttlRaw = Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? DEFAULT_TTL_MINUTES);
  const ttlMinutes = Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : DEFAULT_TTL_MINUTES;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  const token = randomBytes(32).toString("hex");
  const code = generateCode();

  await prisma.passwordResetToken.updateMany({
    where: { userId: existing.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: existing.id,
      tokenHash: hashValue(token),
      codeHash: hashValue(code),
      expiresAt,
      createdById: actor.id,
    },
  });

  const baseUrl = process.env.APP_URL || req.nextUrl.origin;
  const resetUrl = `${baseUrl}/reset-password/confirm?token=${token}`;

  await logAuditEvent({
    actorUserId: actor.id,
    entityType: "USER",
    entityId: existing.id,
    action: "PASSWORD_RESET_REQUESTED",
    before: null,
    after: { email: existing.email },
    metadata: buildAuditMetadata(req),
  });

  const mailResult = await sendMailWithAudit({
    actorUserId: actor.id,
    entityType: "USER",
    entityId: existing.id,
    metadata: buildAuditMetadata(req),
    mail: {
      to: [existing.email],
      subject: "Restablecer contraseña",
      text: [
        `Hola ${existing.name || existing.email},`,
        "",
        "Se solicitó un reinicio de contraseña para tu cuenta.",
        `Código de validación: ${code}`,
        `Enlace: ${resetUrl}`,
        "",
        `Este código vence en ${ttlMinutes} minutos.`,
      ].join("\n"),
    },
  });

  if (!mailResult.ok) {
    return NextResponse.json({ error: "No se pudo enviar el correo" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
