export const RESERVA_REQUEST_TAG = "[RESERVA_REQUEST]";

export type ReservaRequestMeta = {
  programa?: string;
  fecha?: string; // DD/MM/AAAA
  espacio?: string; // label
  espacioKey?: string; // slug
  detalle?: string;
};

export function buildReservaDescription(meta: ReservaRequestMeta) {
  const lines = [
    RESERVA_REQUEST_TAG,
    `programa=${meta.programa ?? ""}`,
    `fecha=${meta.fecha ?? ""}`,
    `espacio=${meta.espacio ?? ""}`,
    `espacioKey=${meta.espacioKey ?? ""}`,
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
    if (key === "espacio") meta.espacio = value;
    if (key === "espacioKey") meta.espacioKey = value;
    if (key === "detalle") meta.detalle = value;
  }
  return meta;
}

export function displayReservaDescription(description: string) {
  const meta = parseReservaDescription(description);
  if (!meta) return description;
  return meta.detalle || "";
}

export function parseFechaDDMMYYYY(input?: string) {
  if (!input) return null;
  const [day, month, year] = input.split("/");
  if (!day || !month || !year) return null;
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!d || !m || !y) return null;
  const date = new Date(y, m - 1, d, 9, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
