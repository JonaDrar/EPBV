import { createHash, randomBytes, randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma, logAuditEvent } from "@ebv/db";
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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.toLowerCase?.().trim?.();

  if (!email) {
    return NextResponse.json({ error: "Correo requerido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return NextResponse.json({ ok: true });
  }

  const ttlRaw = Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? DEFAULT_TTL_MINUTES);
  const ttlMinutes = Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : DEFAULT_TTL_MINUTES;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  const token = randomBytes(32).toString("hex");
  const code = generateCode();

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashValue(token),
      codeHash: hashValue(code),
      expiresAt,
    },
  });

  const baseUrl = process.env.APP_URL || req.nextUrl.origin;
  const resetUrl = `${baseUrl}/reset-password/confirm?token=${token}`;

  await logAuditEvent({
    actorUserId: user.id,
    entityType: "USER",
    entityId: user.id,
    action: "PASSWORD_RESET_REQUESTED",
    before: null,
    after: { email: user.email },
    metadata: buildAuditMetadata(req),
  });

  await sendMailWithAudit({
    actorUserId: user.id,
    entityType: "USER",
    entityId: user.id,
    metadata: buildAuditMetadata(req),
    mail: {
      to: [user.email],
      subject: "Restablecer contraseña",
      text: [
        `Hola ${user.name || user.email},`,
        "",
        "Recibimos una solicitud para restablecer tu contraseña.",
        `Código de validación: ${code}`,
        `Enlace: ${resetUrl}`,
        "",
        `Este código vence en ${ttlMinutes} minutos.`,
      ].join("\n"),
    },
  });

  return NextResponse.json({ ok: true });
}
