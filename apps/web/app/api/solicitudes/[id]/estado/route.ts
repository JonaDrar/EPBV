import { NextRequest, NextResponse } from "next/server";
import { prisma, logAuditEvent } from "@ebv/db";
import { getAuthFromRequest, requireRole } from "@ebv/auth";
import { buildAuditMetadata } from "@/lib/audit";
import { sendMailWithAudit } from "@/lib/mail-audit";
import { getNotificationRecipients } from "@/lib/notifications";
import { parseReservaDescription, parseFechaDDMMYYYY } from "@/lib/reserva-request";

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
  const estado = body?.estado;
  const estadosValidos = ["PENDIENTE", "EN_PROCESO", "RESUELTA", "RECHAZADA"];

  if (!estado || !estadosValidos.includes(estado)) {
    return NextResponse.json({ error: "Estado requerido" }, { status: 400 });
  }

  const solicitud = await prisma.solicitud.findUnique({ where: { id: params.id } });
  if (!solicitud) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
  }

  const updated = await prisma.solicitud.update({
    where: { id: params.id },
    data: { estado },
  });

  await logAuditEvent({
    actorUserId: user.id,
    entityType: "SOLICITUD",
    entityId: updated.id,
    action: "STATUS_CHANGED",
    before: { estado: solicitud.estado },
    after: { estado: updated.estado },
    metadata: buildAuditMetadata(req),
  });

  const recipients = getNotificationRecipients(user.email);
  const estadoLabel =
    updated.tipo === "OTRO" && updated.estado === "RESUELTA" ? "Aprobada" : updated.estado;

  await sendMailWithAudit({
    actorUserId: user.id,
    entityType: "SOLICITUD",
    entityId: updated.id,
    metadata: buildAuditMetadata(req),
    mail: {
      to: recipients,
      subject: `Solicitud actualizada: ${updated.titulo}`,
      text: `La solicitud cambió a estado ${estadoLabel}.`,
    },
  });

  const reservaMeta = parseReservaDescription(updated.descripcion);
  const shouldCreateReserva =
    reservaMeta && (estado === "EN_PROCESO" || estado === "RESUELTA");

  if (shouldCreateReserva) {
    const alreadyCreated = await prisma.auditLog.findFirst({
      where: {
        entityType: "SOLICITUD",
        entityId: updated.id,
        action: "RESERVA_AUTO_CREATED",
      },
    });

    if (!alreadyCreated) {
      try {
        const fecha = parseFechaDDMMYYYY(reservaMeta.fecha);
        if (!fecha) {
          await logAuditEvent({
            actorUserId: user.id,
            entityType: "SOLICITUD",
            entityId: updated.id,
            action: "RESERVA_AUTO_FAILED",
            before: null,
            after: { reason: "Fecha inválida" },
            metadata: buildAuditMetadata(req),
          });
        } else {
          const espacioKey = reservaMeta.espacioKey ?? "";
          const espacioNombre = reservaMeta.espacio ?? (espacioKey === "cancha" ? "Cancha" : "Salon multiuso");
          const espacioTipo = espacioKey === "cancha" ? "CANCHA" : "SALON";

          let espacio = await prisma.espacio.findFirst({
            where: { nombre: { equals: espacioNombre, mode: "insensitive" } },
          });

          if (!espacio) {
            espacio = await prisma.espacio.create({
              data: { nombre: espacioNombre, tipo: espacioTipo, activo: true },
            });
          }

          const fechaFin = new Date(fecha.getTime() + 60 * 60 * 1000);

          const conflicto = await prisma.reserva.findFirst({
            where: {
              espacioId: espacio.id,
              estado: "ACTIVA",
              AND: [{ fechaInicio: { lt: fechaFin } }, { fechaFin: { gt: fecha } }],
            },
          });

          if (conflicto) {
            await logAuditEvent({
              actorUserId: user.id,
              entityType: "SOLICITUD",
              entityId: updated.id,
              action: "RESERVA_AUTO_CONFLICT",
              before: null,
              after: { reservaId: conflicto.id },
              metadata: buildAuditMetadata(req),
            });
          } else {
            const reserva = await prisma.reserva.create({
              data: {
                espacioId: espacio.id,
                usuarioId: solicitud.createdById,
                fechaInicio: fecha,
                fechaFin,
              },
            });

            await logAuditEvent({
              actorUserId: user.id,
              entityType: "RESERVA",
              entityId: reserva.id,
              action: "CREATED",
              before: null,
              after: reserva,
              metadata: buildAuditMetadata(req),
            });

            await logAuditEvent({
              actorUserId: user.id,
              entityType: "SOLICITUD",
              entityId: updated.id,
              action: "RESERVA_AUTO_CREATED",
              before: null,
              after: { reservaId: reserva.id },
              metadata: buildAuditMetadata(req),
            });

            await sendMailWithAudit({
              actorUserId: user.id,
              entityType: "RESERVA",
              entityId: reserva.id,
              metadata: buildAuditMetadata(req),
              mail: {
                to: recipients,
                subject: `Reserva creada: ${espacioNombre}`,
                text: `Reserva desde ${fecha.toISOString()} hasta ${fechaFin.toISOString()}.`,
              },
            });
          }
        }
      } catch (error) {
        await logAuditEvent({
          actorUserId: user.id,
          entityType: "SOLICITUD",
          entityId: updated.id,
          action: "RESERVA_AUTO_FAILED",
          before: null,
          after: { error: (error as Error).message },
          metadata: buildAuditMetadata(req),
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
