export type SolicitudEstado =
  | "RECIBIDA"
  | "EN_PROCESO"
  | "APROBADA"
  | "RECHAZADA"
  | "LISTA";

const nonSpaceTransitions: Record<SolicitudEstado, SolicitudEstado[]> = {
  RECIBIDA: ["EN_PROCESO", "APROBADA", "RECHAZADA"],
  EN_PROCESO: ["APROBADA", "RECHAZADA", "LISTA"],
  APROBADA: ["LISTA"],
  RECHAZADA: [],
  LISTA: [],
};

const spaceTransitions: Record<SolicitudEstado, SolicitudEstado[]> = {
  RECIBIDA: ["APROBADA", "RECHAZADA"],
  EN_PROCESO: [],
  APROBADA: [],
  RECHAZADA: [],
  LISTA: [],
};

export function isSpaceSolicitud(tipo: string) {
  return tipo === "OTRO";
}

export function isSolicitudTransitionAllowed(input: {
  tipo: string;
  currentEstado: SolicitudEstado;
  nextEstado: SolicitudEstado;
}) {
  const allowed = isSpaceSolicitud(input.tipo)
    ? spaceTransitions[input.currentEstado]
    : nonSpaceTransitions[input.currentEstado];
  return allowed.includes(input.nextEstado);
}

export function getSolicitudEstadoLabel(estado: SolicitudEstado) {
  const labels: Record<SolicitudEstado, string> = {
    RECIBIDA: "Recibida",
    EN_PROCESO: "En proceso",
    APROBADA: "Aprobada",
    RECHAZADA: "Rechazada",
    LISTA: "Lista",
  };
  return labels[estado] ?? estado;
}

export function isSolicitudInHistory(input: {
  tipo: string;
  estado: SolicitudEstado;
  fechaFinSolicitada?: Date | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();

  if (isSpaceSolicitud(input.tipo)) {
    if (input.estado === "RECHAZADA") return true;
    if (input.fechaFinSolicitada && now > input.fechaFinSolicitada) return true;
    return false;
  }

  return input.estado === "RECHAZADA" || input.estado === "LISTA";
}
