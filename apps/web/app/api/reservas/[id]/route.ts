import { NextRequest, NextResponse } from "next/server";
import { prisma, logAuditEvent } from "@ebv/db";
import { getAuthFromRequest, requireRole } from "@ebv/auth";
import { buildAuditMetadata } from "@/lib/audit";
import { sendMailWithAudit } from "@/lib/mail-audit";
import { getNotificationRecipients } from "@/lib/notifications";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(req);
  const guard = requireRole(auth, ["ADMIN", "INTERNAL"]);
  if (guard) return guard;
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const reserva = await prisma.reserva.findUnique({
    where: { id: params.id },
    include: { espacio: true },
  });

  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  if (user.role !== "ADMIN" && reserva.usuarioId !== user.id) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  if (reserva.estado === "CANCELADA") {
    return NextResponse.json({ ok: true });
  }

  const updated = await prisma.reserva.update({
    where: { id: reserva.id },
    data: { estado: "CANCELADA" },
  });

  await logAuditEvent({
    actorUserId: user.id,
    entityType: "RESERVA",
    entityId: updated.id,
    action: "CANCELLED",
    before: { estado: reserva.estado },
    after: { estado: updated.estado },
    metadata: buildAuditMetadata(req),
  });

  const recipients = getNotificationRecipients(user.email);
  await sendMailWithAudit({
    actorUserId: user.id,
    entityType: "RESERVA",
    entityId: updated.id,
    metadata: buildAuditMetadata(req),
    mail: {
      to: recipients,
      subject: `Reserva cancelada: ${reserva.espacio.nombre}`,
      text: `La reserva fue cancelada.`,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(req);
  const guard = requireRole(auth, ["ADMIN", "INTERNAL"]);
  if (guard) return guard;
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const fechaInicioRaw = body?.fechaInicio;
  const fechaFinRaw = body?.fechaFin;
  const espacioId = body?.espacioId;

  const existing = await prisma.reserva.findUnique({
    where: { id: params.id },
    include: { espacio: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  if (user.role !== "ADMIN" && existing.usuarioId !== user.id) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const data: { fechaInicio?: Date; fechaFin?: Date; espacioId?: string } = {};

  if (fechaInicioRaw) data.fechaInicio = new Date(fechaInicioRaw);
  if (fechaFinRaw) data.fechaFin = new Date(fechaFinRaw);
  if (espacioId) data.espacioId = espacioId;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  }

  if (data.fechaInicio && Number.isNaN(data.fechaInicio.getTime())) {
    return NextResponse.json({ error: "Fecha inicio inválida" }, { status: 400 });
  }
  if (data.fechaFin && Number.isNaN(data.fechaFin.getTime())) {
    return NextResponse.json({ error: "Fecha fin inválida" }, { status: 400 });
  }
  if (data.fechaInicio && data.fechaFin && data.fechaFin <= data.fechaInicio) {
    return NextResponse.json({ error: "Fecha fin debe ser posterior" }, { status: 400 });
  }

  const inicio = data.fechaInicio ?? existing.fechaInicio;
  const fin = data.fechaFin ?? existing.fechaFin;
  const espacioFinal = data.espacioId ?? existing.espacioId;

  if (data.espacioId) {
    const espacio = await prisma.espacio.findUnique({ where: { id: data.espacioId } });
    if (!espacio || !espacio.activo) {
      return NextResponse.json({ error: "Espacio no disponible" }, { status: 400 });
    }
  }

  const conflicto = await prisma.reserva.findFirst({
    where: {
      id: { not: existing.id },
      espacioId: espacioFinal,
      estado: "ACTIVA",
      AND: [{ fechaInicio: { lt: fin } }, { fechaFin: { gt: inicio } }],
    },
  });

  if (conflicto) {
    return NextResponse.json({ error: "Conflicto de reserva" }, { status: 409 });
  }

  const updated = await prisma.reserva.update({
    where: { id: existing.id },
    data,
  });

  const updatedFull = await prisma.reserva.findUnique({
    where: { id: updated.id },
    include: { espacio: true },
  });

  await logAuditEvent({
    actorUserId: user.id,
    entityType: "RESERVA",
    entityId: updated.id,
    action: "UPDATED",
    before: existing,
    after: updated,
    metadata: buildAuditMetadata(req),
  });

  const recipients = getNotificationRecipients(user.email);
  await sendMailWithAudit({
    actorUserId: user.id,
    entityType: "RESERVA",
    entityId: updated.id,
    metadata: buildAuditMetadata(req),
    mail: {
      to: recipients,
      subject: `Reserva actualizada: ${updatedFull?.espacio.nombre ?? existing.espacio.nombre}`,
      text: `La reserva fue actualizada.`,
    },
  });

  return NextResponse.json({ ok: true });
}
