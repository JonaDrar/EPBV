import { NextRequest, NextResponse } from "next/server";
import { prisma, logAuditEvent } from "@ebv/db";
import { getAuthFromRequest, requireRole, verifyPassword, hashPassword } from "@ebv/auth";
import { buildAuditMetadata } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  const guard = requireRole(auth, ["ADMIN", "INTERNAL"]);
  if (guard) return guard;
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const currentPassword = body?.currentPassword;
  const newPassword = body?.newPassword;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Contraseña muy corta" }, { status: 400 });
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await logAuditEvent({
    actorUserId: user.id,
    entityType: "USER",
    entityId: user.id,
    action: "PASSWORD_CHANGED",
    before: null,
    after: null,
    metadata: buildAuditMetadata(req),
  });

  return NextResponse.json({ ok: true });
}
