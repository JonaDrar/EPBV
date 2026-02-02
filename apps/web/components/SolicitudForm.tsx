"use client";

import { useState } from "react";

export function SolicitudForm() {
  const [tipo, setTipo] = useState("MANTENCION");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/solicitudes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, titulo, descripcion }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo crear la solicitud");
      return;
    }

    setTitulo("");
    setDescripcion("");
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
      <h3 style={{ margin: 0 }}>Nueva solicitud</h3>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Tipo
        <select
          value={tipo}
          onChange={(event) => setTipo(event.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
        >
          <option value="MANTENCION">Mantención</option>
          <option value="ADMINISTRACION">Administración</option>
          <option value="DIFUSION">Difusión</option>
          <option value="OTRO">Otro</option>
        </select>
      </label>
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
