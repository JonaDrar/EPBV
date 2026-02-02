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

  const espacios = await prisma.espacio.findMany({ orderBy: { nombre: "asc" } });
  return NextResponse.json({ data: espacios });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  const guard = requireRole(auth, ["ADMIN"]);
  if (guard) return guard;
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const nombre = body?.nombre?.trim?.();
  const tipo = body?.tipo;
  const tiposValidos = ["SALA", "SALON", "CANCHA"];

  if (!nombre || !tipo || !tiposValidos.includes(tipo)) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const espacio = await prisma.espacio.create({
    data: { nombre, tipo },
  });

  await logAuditEvent({
    actorUserId: user.id,
    entityType: "ESPACIO",
    entityId: espacio.id,
    action: "CREATED",
    before: null,
    after: espacio,
    metadata: buildAuditMetadata(req),
  });

  return NextResponse.json({ ok: true, id: espacio.id });
}
