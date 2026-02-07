import { NextRequest, NextResponse } from "next/server";
import { prisma, logAuditEvent } from "@ebv/db";
import { getAuthFromRequest, requireRole } from "@ebv/auth";
import { buildAuditMetadata } from "@/lib/audit";
import { sendMailWithAudit } from "@/lib/mail-audit";
import { getAdminNotificationRecipients } from "@/lib/notifications";
import { parseBusinessDateRangeToUtc } from "@/lib/schedule";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  const guard = requireRole(auth, ["ADMIN", "INTERNAL"]);
  if (guard) return guard;
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const tipo = body?.tipo;
  const titulo = body?.titulo?.trim?.();
  const descripcion = body?.descripcion?.trim?.();
  const espacioSolicitadoId = body?.espacioSolicitadoId?.trim?.();
  const fecha = body?.fecha?.trim?.();
  const horaInicio = body?.horaInicio?.trim?.();
  const horaFin = body?.horaFin?.trim?.();

  const tiposValidos = ["MANTENCION", "ADMINISTRACION", "DIFUSION", "OTRO"];
  if (!tipo || !tiposValidos.includes(tipo) || !titulo || !descripcion) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  let fechaInicioSolicitada: Date | null = null;
  let fechaFinSolicitada: Date | null = null;
  let espacio: { id: string; nombre: string } | null = null;

  if (tipo === "OTRO") {
    if (!espacioSolicitadoId || !fecha || !horaInicio || !horaFin) {
      return NextResponse.json(
        { error: "Espacio, fecha y horario son requeridos para solicitud de espacio" },
        { status: 400 }
      );
    }

    const parsedRange = parseBusinessDateRangeToUtc(fecha, horaInicio, horaFin);
    if (!parsedRange.ok) {
      return NextResponse.json({ error: parsedRange.error }, { status: 400 });
    }

    const espacioFound = await prisma.espacio.findUnique({
      where: { id: espacioSolicitadoId },
      select: { id: true, nombre: true, activo: true },
    });
    if (!espacioFound || !espacioFound.activo) {
      return NextResponse.json({ error: "Espacio no disponible" }, { status: 400 });
    }

    espacio = { id: espacioFound.id, nombre: espacioFound.nombre };
    fechaInicioSolicitada = parsedRange.start;
    fechaFinSolicitada = parsedRange.end;
  }

  const solicitud = await prisma.solicitud.create({
    data: {
      tipo,
      titulo,
      descripcion,
      espacioSolicitadoId: espacio?.id ?? null,
      fechaInicioSolicitada,
      fechaFinSolicitada,
      createdById: user.id,
    },
  });

  await logAuditEvent({
    actorUserId: user.id,
    entityType: "SOLICITUD",
    entityId: solicitud.id,
    action: "CREATED",
    before: null,
    after: solicitud,
    metadata: buildAuditMetadata(req),
  });

  if (user.role === "INTERNAL") {
    const recipients = await getAdminNotificationRecipients();
    if (recipients.length > 0) {
      await sendMailWithAudit({
        actorUserId: user.id,
        entityType: "SOLICITUD",
        entityId: solicitud.id,
        metadata: buildAuditMetadata(req),
        mail: {
          to: recipients,
          subject: `Nueva solicitud: ${solicitud.titulo}`,
          text:
            tipo === "OTRO"
              ? `Se creó una nueva solicitud de espacio (${espacio?.nombre ?? "espacio"}) por ${user.name || user.email}.`
              : `Se creó una nueva solicitud (${solicitud.tipo}) por ${user.name || user.email}.`,
        },
      });
    }
  }

  return NextResponse.json({ ok: true, id: solicitud.id });
}
