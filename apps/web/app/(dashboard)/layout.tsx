import { requireUser } from "@/lib/auth-server";
import { UserBar } from "@/components/UserBar";
import styles from "./dashboard-layout.module.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className={styles.page}>
      <UserBar user={user} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
