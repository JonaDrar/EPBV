import { requireUser } from "@/lib/auth-server";
import { PerfilPasswordForm } from "@/components/PerfilPasswordForm";

export default async function PerfilPage() {
  const user = await requireUser();

  return (
    <div>
      <h1>Mi perfil</h1>
      <div style={{ marginBottom: 16, color: "var(--muted)" }}>{user.email}</div>
      <PerfilPasswordForm />
    </div>
  );
}
