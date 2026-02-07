import { NextRequest, NextResponse } from "next/server";
import { prisma, logAuditEvent } from "@ebv/db";
import { getAuthFromRequest, requireRole } from "@ebv/auth";
import { buildAuditMetadata } from "@/lib/audit";
import { sendMailWithAudit } from "@/lib/mail-audit";
import {
  getSolicitudEstadoLabel,
  isSolicitudTransitionAllowed,
  isSpaceSolicitud,
  type SolicitudEstado,
} from "@/lib/solicitud-workflow";
import { parseReservaDescription, parseFechaDDMMYYYY } from "@/lib/reserva-request";

export const runtime = "nodejs";

const ESTADOS_VALIDOS: SolicitudEstado[] = [
  "RECIBIDA",
  "EN_PROCESO",
  "APROBADA",
  "RECHAZADA",
  "LISTA",
];

async function resolveSpaceForSolicitud(input: {
  espacioSolicitadoId: string | null;
  fallbackDescription: string;
}) {
  if (input.espacioSolicitadoId) {
    const byId = await prisma.espacio.findUnique({
      where: { id: input.espacioSolicitadoId },
      select: { id: true, nombre: true, activo: true },
    });
    if (byId?.activo) {
      return byId;
    }
  }

  const meta = parseReservaDescription(input.fallbackDescription);

  if (meta?.espacioId) {
    const byMetaId = await prisma.espacio.findUnique({
      where: { id: meta.espacioId },
      select: { id: true, nombre: true, activo: true },
    });
    if (byMetaId?.activo) {
      return byMetaId;
    }
  }

  if (meta?.espacio) {
    const byName = await prisma.espacio.findFirst({
      where: {
        nombre: { equals: meta.espacio, mode: "insensitive" },
        activo: true,
      },
      select: { id: true, nombre: true, activo: true },
      orderBy: { nombre: "asc" },
    });
    if (byName) {
      return byName;
    }
  }

  const espacioTipo = meta?.espacioKey?.toLowerCase().includes("cancha")
    ? "CANCHA"
    : meta?.espacioKey?.toLowerCase().includes("salon")
      ? "SALON"
      : null;

  if (espacioTipo) {
    const byType = await prisma.espacio.findFirst({
      where: { tipo: espacioTipo, activo: true },
      select: { id: true, nombre: true, activo: true },
      orderBy: { nombre: "asc" },
    });
    if (byType) {
      return byType;
    }
  }

  return null;
}

function resolveScheduleFromSolicitud(input: {
  fechaInicioSolicitada: Date | null;
  fechaFinSolicitada: Date | null;
  fallbackDescription: string;
}) {
  if (input.fechaInicioSolicitada && input.fechaFinSolicitada) {
    return {
      start: input.fechaInicioSolicitada,
      end: input.fechaFinSolicitada,
    };
  }

  const meta = parseReservaDescription(input.fallbackDescription);
  const start = input.fechaInicioSolicitada ?? parseFechaDDMMYYYY(meta?.fecha, meta?.horaInicio || "09:00");
  const end = input.fechaFinSolicitada ?? parseFechaDDMMYYYY(meta?.fecha, meta?.horaFin || "10:00");

  if (!start || !end || end <= start) {
    return null;
  }

  return { start, end };
}

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
  const estadoRaw = body?.estado;

  if (!estadoRaw || !ESTADOS_VALIDOS.includes(estadoRaw)) {
    return NextResponse.json({ error: "Estado requerido" }, { status: 400 });
  }

  const nextEstado = estadoRaw as SolicitudEstado;

  const solicitud = await prisma.solicitud.findUnique({
    where: { id: params.id },
    include: {
      createdBy: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });
  if (!solicitud) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
  }

  const currentEstado = solicitud.estado as SolicitudEstado;
  if (currentEstado === nextEstado) {
    return NextResponse.json({ ok: true });
  }

  if (
    !isSolicitudTransitionAllowed({
      tipo: solicitud.tipo,
      currentEstado,
      nextEstado,
    })
  ) {
    return NextResponse.json({ error: "Transición de estado no permitida" }, { status: 400 });
  }

  const auditMetadata = buildAuditMetadata(req);
  const requesterEmail = solicitud.createdBy.email;
  const requesterName = solicitud.createdBy.name || requesterEmail;

  let updatedSolicitudId = solicitud.id;
  let updatedSolicitudTitulo = solicitud.titulo;
  let updatedEstado = nextEstado;
  let createdReserva:
    | { id: string; espacioNombre: string; fechaInicio: Date; fechaFin: Date }
    | null = null;

  if (isSpaceSolicitud(solicitud.tipo) && nextEstado === "APROBADA") {
    const schedule = resolveScheduleFromSolicitud({
      fechaInicioSolicitada: solicitud.fechaInicioSolicitada,
      fechaFinSolicitada: solicitud.fechaFinSolicitada,
      fallbackDescription: solicitud.descripcion,
    });
    if (!schedule) {
      return NextResponse.json(
        { error: "La solicitud no tiene una fecha/hora válida para aprobar." },
        { status: 400 }
      );
    }

    const espacio = await resolveSpaceForSolicitud({
      espacioSolicitadoId: solicitud.espacioSolicitadoId,
      fallbackDescription: solicitud.descripcion,
    });
    if (!espacio) {
      return NextResponse.json({ error: "No se pudo resolver el espacio solicitado." }, { status: 400 });
    }

    const conflicto = await prisma.reserva.findFirst({
      where: {
        espacioId: espacio.id,
        estado: "ACTIVA",
        AND: [
          { fechaInicio: { lt: schedule.end } },
          { fechaFin: { gt: schedule.start } },
        ],
      },
    });

    if (conflicto) {
      return NextResponse.json({ error: "Conflicto de reserva para el horario solicitado." }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.solicitud.update({
        where: { id: solicitud.id },
        data: {
          estado: nextEstado,
          espacioSolicitadoId: solicitud.espacioSolicitadoId ?? espacio.id,
          fechaInicioSolicitada: solicitud.fechaInicioSolicitada ?? schedule.start,
          fechaFinSolicitada: solicitud.fechaFinSolicitada ?? schedule.end,
        },
      });

      const reserva = await tx.reserva.create({
        data: {
          espacioId: espacio.id,
          usuarioId: solicitud.createdById,
          fechaInicio: schedule.start,
          fechaFin: schedule.end,
        },
      });

      return {
        updated,
        reserva,
        espacioNombre: espacio.nombre,
      };
    });

    updatedSolicitudId = result.updated.id;
    updatedSolicitudTitulo = result.updated.titulo;
    updatedEstado = result.updated.estado as SolicitudEstado;
    createdReserva = {
      id: result.reserva.id,
      espacioNombre: result.espacioNombre,
      fechaInicio: result.reserva.fechaInicio,
      fechaFin: result.reserva.fechaFin,
    };

    await logAuditEvent({
      actorUserId: user.id,
      entityType: "RESERVA",
      entityId: createdReserva.id,
      action: "CREATED",
      before: null,
      after: {
        espacioId: solicitud.espacioSolicitadoId ?? espacio.id,
        fechaInicio: createdReserva.fechaInicio,
        fechaFin: createdReserva.fechaFin,
      },
      metadata: auditMetadata,
    });

    await logAuditEvent({
      actorUserId: user.id,
      entityType: "SOLICITUD",
      entityId: updatedSolicitudId,
      action: "RESERVA_AUTO_CREATED",
      before: null,
      after: { reservaId: createdReserva.id },
      metadata: auditMetadata,
    });
  } else {
    const updated = await prisma.solicitud.update({
      where: { id: solicitud.id },
      data: { estado: nextEstado },
    });
    updatedSolicitudId = updated.id;
    updatedSolicitudTitulo = updated.titulo;
    updatedEstado = updated.estado as SolicitudEstado;
  }

  await logAuditEvent({
    actorUserId: user.id,
    entityType: "SOLICITUD",
    entityId: updatedSolicitudId,
    action: "STATUS_CHANGED",
    before: { estado: solicitud.estado },
    after: { estado: updatedEstado },
    metadata: auditMetadata,
  });

  await sendMailWithAudit({
    actorUserId: user.id,
    entityType: "SOLICITUD",
    entityId: updatedSolicitudId,
    metadata: auditMetadata,
    mail: {
      to: [requesterEmail],
      subject: `Solicitud actualizada: ${updatedSolicitudTitulo}`,
      text: `Hola ${requesterName}, tu solicitud cambió a estado ${getSolicitudEstadoLabel(nextEstado)}.`,
    },
  });

  if (createdReserva) {
    await sendMailWithAudit({
      actorUserId: user.id,
      entityType: "RESERVA",
      entityId: createdReserva.id,
      metadata: auditMetadata,
      mail: {
        to: [requesterEmail],
        subject: `Reserva creada: ${createdReserva.espacioNombre}`,
        text: `Tu reserva fue creada desde ${createdReserva.fechaInicio.toISOString()} hasta ${createdReserva.fechaFin.toISOString()}.`,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    reservaId: createdReserva?.id ?? null,
  });
}
