import { prisma } from "@ebv/db";
import { requireUser } from "@/lib/auth-server";
import { AdminHeader } from "@/components/AdminHeader";
import { UserCreateForm } from "@/components/UserCreateForm";
import { UserRoleSelect } from "@/components/UserRoleSelect";
import { UserActiveToggle } from "@/components/UserActiveToggle";
import { UserPasswordReset } from "@/components/UserPasswordReset";
import { UserNameInput } from "@/components/UserNameInput";

export default async function UsuariosPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    return <div>Sin permisos para gestionar usuarios.</div>;
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  type UserRow = (typeof users)[number];

  return (
    <div>
      <AdminHeader
        title="Usuarios"
        subtitle="Crea usuarios, asigna roles, activa o desactiva cuentas y gestiona accesos."
      />
      <UserCreateForm />
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          background: "var(--panel)",
          border: "1px solid var(--border)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 12 }}>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Activo</th>
              <th>Reset por correo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((row: UserRow) => (
              <tr key={row.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td>
                  <UserNameInput userId={row.id} name={row.name} />
                </td>
                <td>{row.email}</td>
                <td>
                  <UserRoleSelect userId={row.id} role={row.role} />
                </td>
                <td>{row.active ? "Sí" : "No"}</td>
                <td>
                  <UserPasswordReset userId={row.id} />
                </td>
                <td>
                  {row.id === user.id ? null : (
                    <UserActiveToggle userId={row.id} active={row.active} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
