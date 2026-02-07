import { parseBusinessDateTimeToUtc } from "@/lib/schedule";

export const RESERVA_REQUEST_TAG = "[RESERVA_REQUEST]";

export type ReservaRequestMeta = {
  programa?: string;
  fecha?: string; // DD/MM/AAAA
  horaInicio?: string; // HH:mm
  horaFin?: string; // HH:mm
  espacio?: string; // label
  espacioKey?: string; // slug
  espacioId?: string;
  detalle?: string;
};

export function buildReservaDescription(meta: ReservaRequestMeta) {
  const lines = [
    RESERVA_REQUEST_TAG,
    `programa=${meta.programa ?? ""}`,
    `fecha=${meta.fecha ?? ""}`,
    `horaInicio=${meta.horaInicio ?? ""}`,
    `horaFin=${meta.horaFin ?? ""}`,
    `espacio=${meta.espacio ?? ""}`,
    `espacioKey=${meta.espacioKey ?? ""}`,
    `espacioId=${meta.espacioId ?? ""}`,
    `detalle=${meta.detalle ?? ""}`,
  ];
  return lines.join("\n");
}

export function parseReservaDescription(description: string): ReservaRequestMeta | null {
  if (!description.startsWith(RESERVA_REQUEST_TAG)) return null;
  const lines = description.split("\n").slice(1);
  const meta: ReservaRequestMeta = {};
  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    const value = rest.join("=").trim();
    if (!key) continue;
    if (key === "programa") meta.programa = value;
    if (key === "fecha") meta.fecha = value;
    if (key === "horaInicio") meta.horaInicio = value;
    if (key === "horaFin") meta.horaFin = value;
    if (key === "espacio") meta.espacio = value;
    if (key === "espacioKey") meta.espacioKey = value;
    if (key === "espacioId") meta.espacioId = value;
    if (key === "detalle") meta.detalle = value;
  }
  return meta;
}

export function displayReservaDescription(description: string) {
  const meta = parseReservaDescription(description);
  if (!meta) return description;
  return meta.detalle || "";
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

export function parseFechaDDMMYYYY(input?: string, hour = "09:00") {
  const isoDate = toISODateInput(input);
  if (!isoDate) return null;
  return parseBusinessDateTimeToUtc(isoDate, hour);
}
