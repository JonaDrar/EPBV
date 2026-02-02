"use client";

import { useState } from "react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const onRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setRequestError(null);
    setRequestMessage(null);

    if (!email) {
      setRequestError("Debes ingresar tu correo.");
      return;
    }

    setRequestLoading(true);

    const res = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setRequestLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setRequestError(data.error ?? "No se pudo enviar el correo");
      return;
    }

    setRequestMessage("Si el correo existe, enviaremos un enlace y código.");
  };

  return (
    <form
      onSubmit={onRequest}
      style={{
        width: 360,
        padding: 24,
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <h1 style={{ margin: 0 }}>¿Olvidaste tu contraseña?</h1>
      <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
        Ingresa tu correo y te enviaremos un enlace con código de validación.
      </p>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Correo
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
        />
      </label>
      {requestError ? (
        <div style={{ color: "#b91c1c", fontSize: 13 }}>{requestError}</div>
      ) : null}
      {requestMessage ? (
        <div style={{ color: "#15803d", fontSize: 13 }}>{requestMessage}</div>
      ) : null}
      <button
        type="submit"
        disabled={requestLoading}
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          border: "none",
          background: "var(--accent)",
          color: "white",
          fontWeight: 600,
        }}
      >
        {requestLoading ? "Enviando..." : "Enviar correo"}
      </button>
      <a href="/reset-password/confirm" style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
        Ya tengo un código
      </a>
    </form>
  );
}
