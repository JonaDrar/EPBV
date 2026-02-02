"use client";

import { useState } from "react";
import { programs } from "@/lib/programs";

export type EventoFormEspacio = { id: string; nombre: string };

export function EventoForm({ espacios }: { espacios: EventoFormEspacio[] }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [espacioId, setEspacioId] = useState(espacios[0]?.id ?? "");
  const [programaSlug, setProgramaSlug] = useState(programs[0]?.slug ?? "");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, descripcion, espacioId, fechaInicio, fechaFin, programaSlug }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo crear el evento");
      return;
    }

    setTitulo("");
    setDescripcion("");
    setFechaInicio("");
    setFechaFin("");
    window.location.reload();
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{
        padding: 16,
        borderRadius: 12,
        background: "var(--panel)",
        border: "1px solid var(--border)",
        display: "grid",
        gap: 12,
        marginBottom: 16,
      }}
    >
      <h3 style={{ margin: 0 }}>Nuevo evento</h3>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Título
        <input
          required
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Descripción
        <textarea
          required
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          rows={3}
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Programa
        <select
          value={programaSlug}
          onChange={(event) => setProgramaSlug(event.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
        >
          {programs.map((program) => (
            <option key={program.slug} value={program.slug}>
              {program.name}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Espacio
        <select
          value={espacioId}
          onChange={(event) => setEspacioId(event.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
        >
          {espacios.map((espacio) => (
            <option key={espacio.id} value={espacio.id}>
              {espacio.nombre}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Inicio
        <input
          type="datetime-local"
          required
          value={fechaInicio}
          onChange={(event) => setFechaInicio(event.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Fin
        <input
          type="datetime-local"
          required
          value={fechaFin}
          onChange={(event) => setFechaFin(event.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
        />
      </label>
      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          border: "none",
          background: "var(--accent)",
          color: "white",
          fontWeight: 600,
          width: "fit-content",
        }}
      >
        {loading ? "Creando..." : "Crear"}
      </button>
    </form>
  );
}
