"use client";

import { useState } from "react";

type SolicitudEstado = "RECIBIDA" | "EN_PROCESO" | "APROBADA" | "RECHAZADA" | "LISTA";
type Role = "ADMIN" | "INTERNAL";

const estados: SolicitudEstado[] = ["RECIBIDA", "EN_PROCESO", "APROBADA", "RECHAZADA", "LISTA"];

export function SolicitudEstadoForm({
  solicitudId,
  estadoActual,
  role,
}: {
  solicitudId: string;
  estadoActual: SolicitudEstado;
  role: Role;
}) {
  const [estado, setEstado] = useState(estadoActual);
  const [loading, setLoading] = useState(false);

  const onChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextEstado = event.target.value as SolicitudEstado;
    setEstado(nextEstado);
    setLoading(true);

    await fetch(`/api/solicitudes/${solicitudId}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nextEstado }),
    });

    setLoading(false);
  };

  return (
    <select
      value={estado}
      onChange={onChange}
      disabled={role !== "ADMIN" || loading}
      style={{ padding: 6, borderRadius: 6, border: "1px solid var(--border)" }}
    >
      {estados.map((estadoItem) => (
        <option key={estadoItem} value={estadoItem}>
          {estadoItem}
        </option>
      ))}
    </select>
  );
}
