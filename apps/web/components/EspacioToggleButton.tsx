"use client";

export function EspacioToggleButton({ espacioId, activo }: { espacioId: string; activo: boolean }) {
  const onToggle = async () => {
    if (activo) {
      await fetch(`/api/espacios/${espacioId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/espacios/${espacioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: true }),
      });
    }
    window.location.reload();
  };

  return (
    <button
      onClick={onToggle}
      style={{
        padding: "6px 10px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: "white",
      }}
    >
      {activo ? "Desactivar" : "Activar"}
    </button>
  );
}
