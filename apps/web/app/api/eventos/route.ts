import { NextRequest, NextResponse } from "next/server";
import { prisma, logAuditEvent } from "@ebv/db";
import { getAuthFromRequest, requireRole } from "@ebv/auth";
import { buildAuditMetadata } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  const guard = requireRole(auth, ["ADMIN", "INTERNAL"]);
  if (guard) return guard;
  if (!auth?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const eventos = await prisma.evento.findMany({
    include: { espacio: true },
    orderBy: { fechaInicio: "asc" },
  });

  return NextResponse.json({ data: eventos });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  const guard = requireRole(auth, ["ADMIN", "INTERNAL"]);
  if (guard) return guard;
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const titulo = body?.titulo?.trim?.();
  const descripcion = body?.descripcion?.trim?.();
  const programaSlug = body?.programaSlug?.trim?.();
  const espacioId = body?.espacioId;
  const fechaInicioRaw = body?.fechaInicio;
  const fechaFinRaw = body?.fechaFin;

  if (!titulo || !descripcion || !espacioId || !fechaInicioRaw || !fechaFinRaw) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const fechaInicio = new Date(fechaInicioRaw);
  const fechaFin = new Date(fechaFinRaw);
  if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) {
    return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 });
  }

  const espacio = await prisma.espacio.findUnique({ where: { id: espacioId } });
  if (!espacio || !espacio.activo) {
    return NextResponse.json({ error: "Espacio no disponible" }, { status: 400 });
  }

  const evento = await prisma.evento.create({
    data: {
      titulo,
      descripcion,
      programaSlug: programaSlug || null,
      espacioId,
      fechaInicio,
      fechaFin,
    },
  });

  await logAuditEvent({
    actorUserId: user.id,
    entityType: "EVENTO",
    entityId: evento.id,
    action: "CREATED",
    before: null,
    after: evento,
    metadata: buildAuditMetadata(req),
  });

  return NextResponse.json({ ok: true, id: evento.id });
}
