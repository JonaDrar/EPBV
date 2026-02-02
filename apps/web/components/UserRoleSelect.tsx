"use client";

import { useState } from "react";

type Role = "ADMIN" | "INTERNAL";

export function UserRoleSelect({ userId, role }: { userId: string; role: Role }) {
  const [value, setValue] = useState(role);
  const [loading, setLoading] = useState(false);

  const onChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRole = event.target.value as Role;
    setValue(nextRole);
    setLoading(true);

    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });

    setLoading(false);
  };

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={loading}
      style={{ padding: 6, borderRadius: 6, border: "1px solid var(--border)" }}
    >
      <option value="ADMIN">ADMIN</option>
      <option value="INTERNAL">INTERNAL</option>
    </select>
  );
}
