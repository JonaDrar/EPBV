"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export function ResetPasswordConfirmClient() {
  const params = useSearchParams();
  const initialToken = useMemo(() => params.get("token") ?? "", [params]);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!initialToken) {
      setError("El enlace no es válido. Revisa el correo e intenta nuevamente.");
      return;
    }
    if (!code) {
      setError("Debes ingresar el código de validación.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: initialToken, code, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo restablecer la contraseña");
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div
        style={{
          width: 360,
          padding: 24,
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0 }}>Contraseña actualizada</h1>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
          Ya puedes iniciar sesión con tu nueva contraseña.
        </p>
        <a href="/login" style={{ fontWeight: 600 }}>
          Ir a login
        </a>
      </div>
    );
  }

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
      <h1 style={{ margin: 0 }}>Restablecer contraseña</h1>
      <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
        Ingresa el enlace recibido y el código de validación.
      </p>
      {!initialToken ? (
        <div style={{ color: "#b91c1c", fontSize: 13 }}>
          Este enlace no contiene un token válido. Vuelve a solicitar el correo.
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Enlace verificado. Ingresa tu código y nueva contraseña.
        </div>
      )}
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Código de validación
        <input
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="6 dígitos"
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Nueva contraseña
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Repite la contraseña
        <input
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
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
        {loading ? "Procesando..." : "Restablecer"}
      </button>
      <a href="/reset-password" style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
        Volver a solicitar correo
      </a>
    </form>
  );
}
