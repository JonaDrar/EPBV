import { NextRequest, NextResponse } from "next/server";
import { prisma, logAuditEvent } from "@ebv/db";
import { getAuthFromRequest, requireRole, hashPassword } from "@ebv/auth";
import { buildAuditMetadata } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  const guard = requireRole(auth, ["ADMIN"]);
  if (guard) return guard;
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = body?.name?.trim?.();
  const email = body?.email?.toLowerCase?.().trim?.();
  const role = body?.role;
  const password = body?.password;

  const rolesValidos = ["ADMIN", "INTERNAL"];
  if (!name || !email || !role || !rolesValidos.includes(role) || !password) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Contraseña muy corta" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Correo ya registrado" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const created = await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash,
      active: true,
    },
  });

  await logAuditEvent({
    actorUserId: user.id,
    entityType: "USER",
    entityId: created.id,
    action: "CREATED",
    before: null,
    after: { name: created.name, email: created.email, role: created.role, active: created.active },
    metadata: buildAuditMetadata(req),
  });

  return NextResponse.json({ ok: true, id: created.id });
}
