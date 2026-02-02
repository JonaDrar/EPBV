import { NextRequest, NextResponse } from "next/server";
import { prisma, logAuditEvent } from "@ebv/db";
import { getAuthFromRequest, requireRole } from "@ebv/auth";
import { buildAuditMetadata } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(req);
  const guard = requireRole(auth, ["ADMIN", "INTERNAL"]);
  if (guard) return guard;
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const comentario = body?.comentario?.trim?.();
  if (!comentario) {
    return NextResponse.json({ error: "Comentario requerido" }, { status: 400 });
  }

  const solicitud = await prisma.solicitud.findUnique({ where: { id: params.id } });
  if (!solicitud) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
  }

  const created = await prisma.solicitudComentario.create({
    data: {
      solicitudId: params.id,
      autorId: user.id,
      comentario,
    },
  });

  await logAuditEvent({
    actorUserId: user.id,
    entityType: "SOLICITUD_COMENTARIO",
    entityId: created.id,
    action: "CREATED",
    before: null,
    after: created,
    metadata: buildAuditMetadata(req),
  });

  return NextResponse.json({ ok: true, id: created.id });
}
