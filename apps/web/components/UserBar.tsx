import type { User } from "@ebv/db";
import { LogoutButton } from "./LogoutButton";
import styles from "./user-bar.module.css";

function getDisplayName(user: Pick<User, "name" | "email">) {
  const cleanName = user.name?.trim();
  if (cleanName) return cleanName;
  const local = user.email.split("@")[0] ?? user.email;
  const readable = local.replace(/[._-]+/g, " ").trim();
  return readable || user.email;
}

export function UserBar({ user }: { user: Pick<User, "name" | "email"> }) {
  const displayName = getDisplayName(user);

  return (
    <div className={styles.wrapper}>
      <div className={styles.greeting}>Hola, {displayName}</div>
      <LogoutButton />
    </div>
  );
}
