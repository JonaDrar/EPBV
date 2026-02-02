"use client";

import { useState } from "react";

export function UserNameInput({ userId, name }: { userId: string; name: string }) {
  const [value, setValue] = useState(name ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const onSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setLoading(true);
    setSaved(false);

    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        style={{ padding: 6, borderRadius: 6, border: "1px solid var(--border)" }}
      />
      <button
        type="button"
        onClick={onSave}
        disabled={loading}
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid var(--border)",
          background: "white",
        }}
      >
        {loading ? "Guardando..." : "Guardar"}
      </button>
      {saved ? <span style={{ fontSize: 12, color: "#15803d" }}>OK</span> : null}
    </div>
  );
}
