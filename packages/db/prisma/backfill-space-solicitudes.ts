import { PrismaClient, EspacioTipo } from "@prisma/client";

const BUSINESS_TIME_ZONE = "America/Santiago";
const RESERVA_REQUEST_TAG = "[RESERVA_REQUEST]";

type ReservaRequestMeta = {
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  espacio?: string;
  espacioKey?: string;
  espacioId?: string;
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

function parseReservaDescription(description: string): ReservaRequestMeta | null {
  if (!description.startsWith(RESERVA_REQUEST_TAG)) return null;

  const lines = description.split("\n").slice(1);
  const meta: ReservaRequestMeta = {};

  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    const value = rest.join("=").trim();
    if (!key) continue;
    if (key === "fecha") meta.fecha = value;
    if (key === "horaInicio") meta.horaInicio = value;
    if (key === "horaFin") meta.horaFin = value;
    if (key === "espacio") meta.espacio = value;
    if (key === "espacioKey") meta.espacioKey = value;
    if (key === "espacioId") meta.espacioId = value;
  }

  return meta;
}

function parseDateInput(input: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function parseTimeInput(input: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(input);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = dtf.formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return asUtc - date.getTime();
}

function parseBusinessDateTimeToUtc(dateInput: string, timeInput: string) {
  const date = parseDateInput(dateInput);
  const time = parseTimeInput(timeInput);
  if (!date || !time) return null;

  const utcGuess = new Date(
    Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute, 0, 0)
  );

  const firstOffset = getTimeZoneOffsetMs(utcGuess, BUSINESS_TIME_ZONE);
  let result = new Date(utcGuess.getTime() - firstOffset);

  const secondOffset = getTimeZoneOffsetMs(result, BUSINESS_TIME_ZONE);
  if (secondOffset !== firstOffset) {
    result = new Date(utcGuess.getTime() - secondOffset);
  }

  return result;
}

function toISODateInput(input?: string) {
  if (!input) return null;
  const [day, month, year] = input.split("/");
  if (!day || !month || !year) return null;
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!d || !m || !y) return null;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

async function logBackfillFailure(solicitudId: string, reason: string, meta?: ReservaRequestMeta | null) {
  await prisma.auditLog.create({
    data: {
      actorUserId: null,
      entityType: "SOLICITUD",
      entityId: solicitudId,
      action: "SPACE_REQUEST_BACKFILL_FAILED",
      before: null,
      after: {
        reason,
        meta,
      },
      metadata: {
        script: "backfill-space-solicitudes",
        timeZone: BUSINESS_TIME_ZONE,
      },
    },
  });
}

async function resolveEspacioId(meta: ReservaRequestMeta) {
  if (meta.espacioId) {
    const byId = await prisma.espacio.findUnique({ where: { id: meta.espacioId } });
    if (byId) return byId.id;
  }

  if (meta.espacio) {
    const byName = await prisma.espacio.findFirst({
      where: {
        nombre: { equals: meta.espacio, mode: "insensitive" },
      },
      orderBy: { activo: "desc" },
    });

    if (byName) return byName.id;
  }

  const inferredTipo: EspacioTipo | null = meta.espacioKey?.toLowerCase().includes("cancha")
    ? "CANCHA"
    : meta.espacioKey?.toLowerCase().includes("salon")
      ? "SALON"
      : null;

  if (inferredTipo) {
    const byTipo = await prisma.espacio.findFirst({
      where: { tipo: inferredTipo, activo: true },
      orderBy: { nombre: "asc" },
    });
    if (byTipo) return byTipo.id;
  }

  return null;
}

async function main() {
  const solicitudes = await prisma.solicitud.findMany({
    where: {
      tipo: "OTRO",
      OR: [
        { fechaInicioSolicitada: null },
        { fechaFinSolicitada: null },
        { espacioSolicitadoId: null },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  let updated = 0;
  let failures = 0;

  for (const solicitud of solicitudes) {
    const meta = parseReservaDescription(solicitud.descripcion);
    const isoDate = toISODateInput(meta?.fecha);

    if (!isoDate) {
      failures += 1;
      await logBackfillFailure(solicitud.id, "No se pudo parsear fecha de la descripción", meta);
      continue;
    }

    const start = parseBusinessDateTimeToUtc(isoDate, meta?.horaInicio || "09:00");
    const end = parseBusinessDateTimeToUtc(isoDate, meta?.horaFin || "10:00");

    if (!start || !end || end <= start) {
      failures += 1;
      await logBackfillFailure(
        solicitud.id,
        "No se pudo construir un rango horario válido",
        meta
      );
      continue;
    }

    const data: {
      fechaInicioSolicitada?: Date;
      fechaFinSolicitada?: Date;
      espacioSolicitadoId?: string;
    } = {};

    if (!solicitud.fechaInicioSolicitada) {
      data.fechaInicioSolicitada = start;
    }
    if (!solicitud.fechaFinSolicitada) {
      data.fechaFinSolicitada = end;
    }

    if (!solicitud.espacioSolicitadoId) {
      const espacioId = await resolveEspacioId(meta || {});
      if (espacioId) {
        data.espacioSolicitadoId = espacioId;
      } else {
        failures += 1;
        await logBackfillFailure(
          solicitud.id,
          "No se pudo resolver espacio solicitado",
          meta
        );
      }
    }

    if (Object.keys(data).length === 0) {
      continue;
    }

    await prisma.solicitud.update({
      where: { id: solicitud.id },
      data,
    });

    updated += 1;
  }

  console.log(
    JSON.stringify(
      {
        script: "backfill-space-solicitudes",
        inspected: solicitudes.length,
        updated,
        failures,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
