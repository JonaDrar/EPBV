import { requireUser } from "@/lib/auth-server";
import { UserBar } from "@/components/UserBar";
export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", position: "relative" }}>
      <UserBar user={user} />
      {children}
    </div>
  );
}
