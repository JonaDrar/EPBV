"use client";

import { useState } from "react";

export function UserPasswordReset({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo enviar el correo");
      return;
    }

    setMessage("Correo enviado");
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", gap: 6, alignItems: "center" }}>
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
        {loading ? "Enviando..." : "Enviar reset"}
      </button>
      {message ? <span style={{ color: "#15803d", fontSize: 12 }}>{message}</span> : null}
      {error ? <span style={{ color: "#b91c1c", fontSize: 12 }}>{error}</span> : null}
    </form>
  );
}
