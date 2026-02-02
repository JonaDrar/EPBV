import { NextRequest, NextResponse } from "next/server";
import { prisma, logAuditEvent } from "@ebv/db";
import { getAuthFromRequest, requireRole } from "@ebv/auth";
import { buildAuditMetadata } from "@/lib/audit";
import { sendMailWithAudit } from "@/lib/mail-audit";
import { getNotificationRecipients } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  const guard = requireRole(auth, ["ADMIN", "INTERNAL"]);
  if (guard) return guard;
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const espacioId = body?.espacioId;
  const fechaInicioRaw = body?.fechaInicio;
  const fechaFinRaw = body?.fechaFin;

  if (!espacioId || !fechaInicioRaw || !fechaFinRaw) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const fechaInicio = new Date(fechaInicioRaw);
  const fechaFin = new Date(fechaFinRaw);
  if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) {
    return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 });
  }

  if (fechaFin <= fechaInicio) {
    return NextResponse.json({ error: "Fecha fin debe ser posterior" }, { status: 400 });
  }

  const espacio = await prisma.espacio.findUnique({ where: { id: espacioId } });
  if (!espacio || !espacio.activo) {
    return NextResponse.json({ error: "Espacio no disponible" }, { status: 400 });
  }

  const conflicto = await prisma.reserva.findFirst({
    where: {
      espacioId,
      estado: "ACTIVA",
      AND: [
        { fechaInicio: { lt: fechaFin } },
        { fechaFin: { gt: fechaInicio } },
      ],
    },
  });

  if (conflicto) {
    return NextResponse.json({ error: "Conflicto de reserva" }, { status: 409 });
  }

  const reserva = await prisma.reserva.create({
    data: {
      espacioId,
      usuarioId: user.id,
      fechaInicio,
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

  const recipients = getNotificationRecipients(user.email);
  await sendMailWithAudit({
    actorUserId: user.id,
    entityType: "RESERVA",
    entityId: reserva.id,
    metadata: buildAuditMetadata(req),
    mail: {
      to: recipients,
      subject: `Reserva creada: ${espacio.nombre}`,
      text: `Reserva desde ${fechaInicio.toISOString()} hasta ${fechaFin.toISOString()}.`,
    },
  });

  return NextResponse.json({ ok: true, id: reserva.id });
}
