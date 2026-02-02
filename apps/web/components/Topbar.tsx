import type { User } from "@ebv/db";
import { LogoutButton } from "./LogoutButton";

export function Topbar({ user }: { user: User }) {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--panel)",
      }}
    >
      <div>
        <div style={{ fontWeight: 600 }}>{user.email}</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          {user.role}
        </div>
      </div>
      <LogoutButton />
    </header>
  );
}
