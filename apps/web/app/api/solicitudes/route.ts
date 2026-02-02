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
  const tipo = body?.tipo;
  const titulo = body?.titulo?.trim?.();
  const descripcion = body?.descripcion?.trim?.();

  const tiposValidos = ["MANTENCION", "ADMINISTRACION", "DIFUSION", "OTRO"];
  if (!tipo || !tiposValidos.includes(tipo) || !titulo || !descripcion) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const solicitud = await prisma.solicitud.create({
    data: {
      tipo,
      titulo,
      descripcion,
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

  const recipients = getNotificationRecipients(user.email);
  await sendMailWithAudit({
    actorUserId: user.id,
    entityType: "SOLICITUD",
    entityId: solicitud.id,
    metadata: buildAuditMetadata(req),
    mail: {
      to: recipients,
      subject: `Nueva solicitud: ${solicitud.titulo}`,
      text: `Se creó una nueva solicitud (${solicitud.tipo}).`,
    },
  });

  return NextResponse.json({ ok: true, id: solicitud.id });
}
