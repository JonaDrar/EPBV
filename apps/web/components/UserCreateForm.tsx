"use client";

import { useState } from "react";

export function UserCreateForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("INTERNAL");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo crear el usuario");
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
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
      <h3 style={{ margin: 0 }}>Nuevo usuario</h3>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Nombre
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
        />
      </label>
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
        Rol
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
        >
          <option value="ADMIN">Admin</option>
          <option value="INTERNAL">Interno</option>
        </select>
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Contraseña inicial
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
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
