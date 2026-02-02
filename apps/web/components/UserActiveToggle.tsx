"use client";

import { useState } from "react";

export function UserActiveToggle({ userId, active }: { userId: string; active: boolean }) {
  const [loading, setLoading] = useState(false);

  const onToggle = async () => {
    setLoading(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setLoading(false);
    window.location.reload();
  };

  return (
    <button
      onClick={onToggle}
      disabled={loading}
      style={{
        padding: "6px 10px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: "white",
      }}
    >
      {active ? "Desactivar" : "Activar"}
    </button>
  );
}
