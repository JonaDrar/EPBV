"use client";

export function ReservaCancelButton({ reservaId }: { reservaId: string }) {
  const onCancel = async () => {
    await fetch(`/api/reservas/${reservaId}`, { method: "DELETE" });
    window.location.reload();
  };

  return (
    <button
      onClick={onCancel}
      style={{
        padding: "6px 10px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: "white",
      }}
    >
      Cancelar
    </button>
  );
}
