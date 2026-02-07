import { existsSync, readFileSync } from "fs";
import path from "path";
import { PrismaClient, type SolicitudEstado } from "@prisma/client";

const E2E_TITLE_PREFIX = "[E2E][PW]";
const E2E_PASSWORD_HASH = "$2a$12$vTt1ZlCfUenX7fHm.WCHyeLtPqfhnbxs/Be4yqzGtU2af0r9lLtHq";

export const E2E_ADMIN_USER = {
  email: "e2e-admin@ebv.local",
  password: "E2ePass!234",
  name: "Admin E2E",
} as const;

export const E2E_INTERNAL_USER = {
  email: "e2e-internal@ebv.local",
  password: "E2ePass!234",
  name: "Internal E2E",
} as const;

export const E2E_CANCHA_SPACE = {
  id: "e2e-cancha-space",
  nombre: "Cancha E2E",
} as const;

export const E2E_SALON_SPACE = {
  id: "e2e-salon-space",
  nombre: "Salon E2E",
} as const;

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalIndex = line.indexOf("=");
    if (equalIndex <= 0) continue;

    const key = line.slice(0, equalIndex).trim();
    if (!key || process.env[key]) continue;

    let value = line.slice(equalIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function loadEnvForTests() {
  const cwd = process.cwd();
  const candidates = [
    path.resolve(cwd, ".env"),
    path.resolve(cwd, "../.env"),
    path.resolve(cwd, "../../.env"),
  ];

  for (const candidate of candidates) {
    loadEnvFile(candidate);
  }

  // Mirror app runtime behavior in development to avoid pooled connection limits.
  if (process.env.DIRECT_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL;
  }
}

loadEnvForTests();

const prisma = new PrismaClient();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function toDdMmYyyy(date: Date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function toTimeInput(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function buildReservaRequestDescription(input: {
  espacioNombre: string;
  espacioId: string;
  start: Date;
  end: Date;
  detail: string;
}) {
  const lines = [
    "[RESERVA_REQUEST]",
    "programa=Programa E2E",
    `fecha=${toDdMmYyyy(input.start)}`,
    `horaInicio=${toTimeInput(input.start)}`,
    `horaFin=${toTimeInput(input.end)}`,
    `espacio=${input.espacioNombre}`,
    "espacioKey=cancha",
    `espacioId=${input.espacioId}`,
    `detalle=${input.detail}`,
  ];

  return lines.join("\n");
}

function buildFutureWindow(daysFromNow = 2, startHour = 10, durationHours = 1) {
  const start = new Date();
  start.setDate(start.getDate() + daysFromNow);
  start.setHours(startHour, 0, 0, 0);

  if (start.getTime() <= Date.now()) {
    start.setDate(start.getDate() + 1);
  }

  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

  return { start, end };
}

export function nextDateInput(daysFromNow = 2) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return toDateInput(date);
}

export async function ensureE2EBaseData() {
  await prisma.user.upsert({
    where: { email: E2E_ADMIN_USER.email },
    update: {
      name: E2E_ADMIN_USER.name,
      role: "ADMIN",
      active: true,
      passwordHash: E2E_PASSWORD_HASH,
    },
    create: {
      email: E2E_ADMIN_USER.email,
      name: E2E_ADMIN_USER.name,
      role: "ADMIN",
      active: true,
      passwordHash: E2E_PASSWORD_HASH,
    },
  });

  await prisma.user.upsert({
    where: { email: E2E_INTERNAL_USER.email },
    update: {
      name: E2E_INTERNAL_USER.name,
      role: "INTERNAL",
      active: true,
      passwordHash: E2E_PASSWORD_HASH,
    },
    create: {
      email: E2E_INTERNAL_USER.email,
      name: E2E_INTERNAL_USER.name,
      role: "INTERNAL",
      active: true,
      passwordHash: E2E_PASSWORD_HASH,
    },
  });

  await prisma.espacio.upsert({
    where: { id: E2E_CANCHA_SPACE.id },
    update: {
      nombre: E2E_CANCHA_SPACE.nombre,
      tipo: "CANCHA",
      activo: true,
    },
    create: {
      id: E2E_CANCHA_SPACE.id,
      nombre: E2E_CANCHA_SPACE.nombre,
      tipo: "CANCHA",
      activo: true,
    },
  });

  await prisma.espacio.upsert({
    where: { id: E2E_SALON_SPACE.id },
    update: {
      nombre: E2E_SALON_SPACE.nombre,
      tipo: "SALON",
      activo: true,
    },
    create: {
      id: E2E_SALON_SPACE.id,
      nombre: E2E_SALON_SPACE.nombre,
      tipo: "SALON",
      activo: true,
    },
  });
}

export async function resetE2EFlowData() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [E2E_ADMIN_USER.email, E2E_INTERNAL_USER.email],
      },
    },
    select: { id: true },
  });

  const userIds = users.map((item) => item.id);

  if (userIds.length === 0) return;

  const solicitudes = await prisma.solicitud.findMany({
    where: {
      createdById: { in: userIds },
      titulo: { startsWith: E2E_TITLE_PREFIX },
    },
    select: { id: true },
  });

  const solicitudIds = solicitudes.map((item) => item.id);

  if (solicitudIds.length > 0) {
    await prisma.solicitudComentario.deleteMany({
      where: {
        solicitudId: { in: solicitudIds },
      },
    });

    await prisma.solicitud.deleteMany({
      where: {
        id: { in: solicitudIds },
      },
    });
  }

  await prisma.reserva.deleteMany({
    where: {
      usuarioId: { in: userIds },
      espacioId: { in: [E2E_CANCHA_SPACE.id, E2E_SALON_SPACE.id] },
    },
  });

  await prisma.session.deleteMany({
    where: {
      userId: { in: userIds },
    },
  });
}

export async function createPendingSpaceSolicitud(input: {
  detail: string;
  titleSuffix: string;
  daysFromNow?: number;
  startHour?: number;
  durationHours?: number;
}) {
  const internalUser = await prisma.user.findUnique({
    where: { email: E2E_INTERNAL_USER.email },
    select: { id: true },
  });

  if (!internalUser) {
    throw new Error("Missing INTERNAL E2E user.");
  }

  const { start, end } = buildFutureWindow(
    input.daysFromNow,
    input.startHour,
    input.durationHours
  );

  const title = `${E2E_TITLE_PREFIX} ${input.titleSuffix}`;
  const descripcion = buildReservaRequestDescription({
    espacioNombre: E2E_CANCHA_SPACE.nombre,
    espacioId: E2E_CANCHA_SPACE.id,
    start,
    end,
    detail: input.detail,
  });

  const solicitud = await prisma.solicitud.create({
    data: {
      tipo: "OTRO",
      estado: "RECIBIDA",
      titulo: title,
      descripcion,
      espacioSolicitadoId: E2E_CANCHA_SPACE.id,
      fechaInicioSolicitada: start,
      fechaFinSolicitada: end,
      createdById: internalUser.id,
    },
  });

  return {
    solicitudId: solicitud.id,
    userId: internalUser.id,
    espacioId: E2E_CANCHA_SPACE.id,
    start,
    end,
    title,
    detail: input.detail,
  };
}

async function waitFor<T>(
  producer: () => Promise<T | null>,
  timeoutMs = 10_000,
  intervalMs = 250
): Promise<T | null> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await producer();
    if (result) return result;
    await sleep(intervalMs);
  }

  return null;
}

export async function waitForSolicitudByDetail(detail: string, timeoutMs = 10_000) {
  return waitFor(async () => {
    return prisma.solicitud.findFirst({
      where: {
        createdBy: { email: E2E_INTERNAL_USER.email },
        descripcion: { contains: `detalle=${detail}` },
      },
      orderBy: { createdAt: "desc" },
    });
  }, timeoutMs);
}

export async function waitForSolicitudEstado(
  solicitudId: string,
  estado: SolicitudEstado,
  timeoutMs = 10_000
) {
  return waitFor(async () => {
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: solicitudId },
    });

    if (!solicitud || solicitud.estado !== estado) {
      return null;
    }

    return solicitud;
  }, timeoutMs);
}

export async function waitForReserva(input: {
  userId: string;
  espacioId: string;
  start: Date;
  end: Date;
  timeoutMs?: number;
}) {
  const startFrom = new Date(input.start.getTime() - 60_000);
  const startTo = new Date(input.start.getTime() + 60_000);
  const endFrom = new Date(input.end.getTime() - 60_000);
  const endTo = new Date(input.end.getTime() + 60_000);

  return waitFor(async () => {
    return prisma.reserva.findFirst({
      where: {
        estado: "ACTIVA",
        usuarioId: input.userId,
        espacioId: input.espacioId,
        AND: [
          { fechaInicio: { gte: startFrom, lte: startTo } },
          { fechaFin: { gte: endFrom, lte: endTo } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  }, input.timeoutMs ?? 10_000);
}

export async function disconnectE2EPrisma() {
  await prisma.$disconnect();
}
