"use client";

import { useState } from "react";

export function PerfilPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "No se pudo cambiar la contraseña");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setMessage("Contraseña actualizada");
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
        maxWidth: 420,
      }}
    >
      <h3 style={{ margin: 0 }}>Cambiar contraseña</h3>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Actual
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Nueva
        <input
          type="password"
          required
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
        />
      </label>
      {message ? (
        <div style={{ color: message.includes("actualizada") ? "#15803d" : "#b91c1c" }}>
          {message}
        </div>
      ) : null}
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
        {loading ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
