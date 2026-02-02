import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ebv/db";
import { getAuthFromRequest, requireRole } from "@ebv/auth";
import { parseReservaDescription, parseFechaDDMMYYYY } from "@/lib/reserva-request";

export const runtime = "nodejs";

function buildRangeFilter(start?: string | null, end?: string | null) {
  if (!start || !end) return {};
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return {};
  }
  return {
    AND: [{ fechaInicio: { lt: endDate } }, { fechaFin: { gt: startDate } }],
  };
}

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  const guard = requireRole(auth, ["ADMIN", "INTERNAL"]);
  if (guard) return guard;

  const start = req.nextUrl.searchParams.get("start");
  const end = req.nextUrl.searchParams.get("end");
  const includeSolicitudes = req.nextUrl.searchParams.get("includeSolicitudes") === "1";
  const rangeFilterReserva = buildRangeFilter(start, end);
  const rangeFilterEvento = buildRangeFilter(start, end);

  const [reservas, eventos] = await Promise.all([
    prisma.reserva.findMany({
      where: {
        estado: "ACTIVA",
        ...rangeFilterReserva,
      },
      include: { espacio: true },
      orderBy: { fechaInicio: "asc" },
    }),
    prisma.evento.findMany({
      where: rangeFilterEvento,
      include: { espacio: true },
      orderBy: { fechaInicio: "asc" },
    }),
  ]);
  type ReservaItem = (typeof reservas)[number];
  type EventoItem = (typeof eventos)[number];

  let solicitudEvents: Array<Record<string, unknown>> = [];
  if (includeSolicitudes && auth?.user.role === "ADMIN") {
    const solicitudes = await prisma.solicitud.findMany({
      where: {
        tipo: "OTRO",
        estado: "PENDIENTE",
      },
      include: { createdBy: true },
      orderBy: { createdAt: "asc" },
    });

    const rangeStart = start ? new Date(start) : null;
    const rangeEnd = end ? new Date(end) : null;

    const mapped: Array<Record<string, unknown>> = [];
    for (const solicitud of solicitudes) {
      const meta = parseReservaDescription(solicitud.descripcion);
      const fecha = parseFechaDDMMYYYY(meta?.fecha);
      if (!fecha) continue;
      const fechaFin = new Date(fecha.getTime() + 60 * 60 * 1000);
      if (rangeStart && rangeEnd) {
        if (!(fecha < rangeEnd && fechaFin > rangeStart)) continue;
      }
      const requesterEmail = solicitud.createdBy.email;
      const requesterName = solicitud.createdBy.name || requesterEmail.split("@")[0] || requesterEmail;
      mapped.push({
        id: `solicitud-${solicitud.id}`,
        title: `Solicitud • ${meta?.espacio || meta?.programa || "Espacio"}`,
        start: fecha.toISOString(),
        end: fechaFin.toISOString(),
        backgroundColor: "#cc5fa7",
        borderColor: "#cc5fa7",
        solicitudId: solicitud.id,
        programa: meta?.programa ?? "",
        espacio: meta?.espacio ?? "",
        solicitante: requesterName,
        detalle: meta?.detalle ?? "",
        fechaLabel: meta?.fecha ?? "",
      });
    }
    solicitudEvents = mapped;
  }

  const events = [
    ...reservas.map((reserva: ReservaItem) => ({
      id: `reserva-${reserva.id}`,
      title: `Reserva • ${reserva.espacio.nombre}`,
      start: reserva.fechaInicio.toISOString(),
      end: reserva.fechaFin.toISOString(),
      backgroundColor: "#2b8dd6",
      borderColor: "#2b8dd6",
    })),
    ...eventos.map((evento: EventoItem) => ({
      id: `evento-${evento.id}`,
      title: evento.titulo,
      start: evento.fechaInicio.toISOString(),
      end: evento.fechaFin.toISOString(),
      backgroundColor: "#e25527",
      borderColor: "#e25527",
    })),
    ...solicitudEvents,
  ];

  return NextResponse.json({ events });
}
