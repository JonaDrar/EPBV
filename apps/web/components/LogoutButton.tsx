"use client";

export function LogoutButton() {
  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <button
      onClick={onLogout}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "white",
      }}
    >
      Cerrar sesión
    </button>
  );
}
