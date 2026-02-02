import { NextRequest, NextResponse } from "next/server";
import { prisma, logAuditEvent } from "@ebv/db";
import { getAuthFromRequest, requireRole } from "@ebv/auth";
import { buildAuditMetadata } from "@/lib/audit";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(req);
  const guard = requireRole(auth, ["ADMIN"]);
  if (guard) return guard;
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const data: { role?: "ADMIN" | "INTERNAL"; active?: boolean; name?: string } = {};

  if (body?.role) {
    if (!['ADMIN', 'INTERNAL'].includes(body.role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }
    data.role = body.role;
  }
  if (typeof body?.name === "string") {
    const trimmed = body.name.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
    }
    data.name = trimmed;
  }
  if (typeof body?.active === "boolean") data.active = body.active;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const removingAdmin =
    existing.role === "ADMIN" &&
    (data.role === "INTERNAL" || data.active === false);

  if (removingAdmin) {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN", active: true },
    });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Debe existir al menos un admin activo" },
        { status: 400 }
      );
    }
  }

  if (existing.id === user.id && data.active === false) {
    return NextResponse.json({ error: "No puedes desactivarte" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data,
  });

  await logAuditEvent({
    actorUserId: user.id,
    entityType: "USER",
    entityId: updated.id,
    action: "UPDATED",
    before: { role: existing.role, active: existing.active, name: existing.name },
    after: { role: updated.role, active: updated.active, name: updated.name },
    metadata: buildAuditMetadata(req),
  });

  return NextResponse.json({ ok: true });
}
