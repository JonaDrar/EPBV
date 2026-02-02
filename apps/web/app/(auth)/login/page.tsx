"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo iniciar sesión");
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <form
      onSubmit={onSubmit}
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
      <h1 style={{ margin: 0 }}>Ingresar</h1>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Correo
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Contraseña
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
        />
      </label>
      {error ? (
        <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div>
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
        }}
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
      <a
        href="/reset-password"
        style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}
      >
        ¿Olvidaste tu contraseña?
      </a>
    </form>
  );
}
