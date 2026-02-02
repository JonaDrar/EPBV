import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma, logAuditEvent } from "@ebv/db";
import { hashPassword } from "@ebv/auth";
import { buildAuditMetadata } from "@/lib/audit";

export const runtime = "nodejs";

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = body?.token?.trim?.();
  const code = body?.code?.trim?.();
  const password = body?.password;

  if (!token || !code || !password) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Contraseña muy corta" }, { status: 400 });
  }

  const tokenHash = hashValue(token);
  const codeHash = hashValue(code);

  const resetRecord = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      codeHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!resetRecord) {
    return NextResponse.json({ error: "Código inválido o expirado" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await logAuditEvent({
    actorUserId: resetRecord.userId,
    entityType: "USER",
    entityId: resetRecord.userId,
    action: "PASSWORD_RESET_COMPLETED",
    before: null,
    after: { email: resetRecord.user.email },
    metadata: buildAuditMetadata(req),
  });

  return NextResponse.json({ ok: true });
}
