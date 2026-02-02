import { prisma } from "@ebv/db";
import { requireUser } from "@/lib/auth-server";
import { AdminHeader } from "@/components/AdminHeader";
import { EspacioForm } from "@/components/EspacioForm";
import { EspacioToggleButton } from "@/components/EspacioToggleButton";

export default async function EspaciosPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    return <div>Sin permisos para gestionar espacios.</div>;
  }

  const espacios = await prisma.espacio.findMany({ orderBy: { nombre: "asc" } });

  return (
    <div>
      <AdminHeader
        title="Espacios"
        subtitle="Crea espacios, define tipo y controla disponibilidad."
      />
      <EspacioForm />
      <div style={{
        padding: 16,
        borderRadius: 12,
        background: "var(--panel)",
        border: "1px solid var(--border)",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 12 }}>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Activo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {espacios.map((espacio) => (
              <tr key={espacio.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td>{espacio.nombre}</td>
                <td>{espacio.tipo}</td>
                <td>{espacio.activo ? "Sí" : "No"}</td>
                <td>
                  <EspacioToggleButton espacioId={espacio.id} activo={espacio.activo} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
