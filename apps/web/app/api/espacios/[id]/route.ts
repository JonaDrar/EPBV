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
  const data: { nombre?: string; tipo?: string; activo?: boolean } = {};
  if (body?.nombre) data.nombre = body.nombre.trim();
  if (body?.tipo) data.tipo = body.tipo;
  if (typeof body?.activo === "boolean") data.activo = body.activo;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  }

  const existing = await prisma.espacio.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Espacio no encontrado" }, { status: 404 });
  }

  const updated = await prisma.espacio.update({
    where: { id: params.id },
    data,
  });

  await logAuditEvent({
    actorUserId: user.id,
    entityType: "ESPACIO",
    entityId: updated.id,
    action: "UPDATED",
    before: existing,
    after: updated,
    metadata: buildAuditMetadata(req),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(req);
  const guard = requireRole(auth, ["ADMIN"]);
  if (guard) return guard;
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const existing = await prisma.espacio.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Espacio no encontrado" }, { status: 404 });
  }

  const updated = await prisma.espacio.update({
    where: { id: params.id },
    data: { activo: false },
  });

  await logAuditEvent({
    actorUserId: user.id,
    entityType: "ESPACIO",
    entityId: updated.id,
    action: "DELETED",
    before: existing,
    after: updated,
    metadata: buildAuditMetadata(req),
  });

  return NextResponse.json({ ok: true });
}
