"use client";

import { useState } from "react";

export function SolicitudComentarioForm({ solicitudId }: { solicitudId: string }) {
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!comentario.trim()) return;
    setLoading(true);

    await fetch(`/api/solicitudes/${solicitudId}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comentario }),
    });

    setLoading(false);
    setComentario("");
    window.location.reload();
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <input
        value={comentario}
        onChange={(event) => setComentario(event.target.value)}
        placeholder="Agregar comentario"
        style={{
          flex: 1,
          padding: 6,
          borderRadius: 6,
          border: "1px solid var(--border)",
        }}
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid var(--border)",
          background: "white",
        }}
      >
        Enviar
      </button>
    </form>
  );
}
