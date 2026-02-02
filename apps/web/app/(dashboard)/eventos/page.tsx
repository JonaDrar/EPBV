import { prisma } from "@ebv/db";
import { AdminHeader } from "@/components/AdminHeader";
import { EventoForm } from "@/components/EventoForm";
import { programs } from "@/lib/programs";

export default async function EventosPage() {
  const espacios = await prisma.espacio.findMany({ where: { activo: true } });
  type EspacioItem = (typeof espacios)[number];
  const eventos = await prisma.evento.findMany({
    include: { espacio: true },
    orderBy: { fechaInicio: "asc" },
  });

  const programNameBySlug = new Map(programs.map((program) => [program.slug, program.name]));

  return (
    <div>
      <AdminHeader
        title="Agenda de eventos"
        subtitle="Planifica y revisa eventos del espacio."
      />
      {espacios.length === 0 ? (
        <div style={{ marginBottom: 16, color: "var(--muted)" }}>
          No hay espacios activos para agendar eventos.
        </div>
      ) : (
        <EventoForm
          espacios={espacios.map((espacio: EspacioItem) => ({ id: espacio.id, nombre: espacio.nombre }))}
        />
      )}
      <div style={{
        padding: 16,
        borderRadius: 12,
        background: "var(--panel)",
        border: "1px solid var(--border)",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 12 }}>
              <th>Título</th>
              <th>Programa</th>
              <th>Espacio</th>
              <th>Inicio</th>
              <th>Fin</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map((evento) => (
              <tr key={evento.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td>{evento.titulo}</td>
                <td>{programNameBySlug.get(evento.programaSlug ?? "") ?? "—"}</td>
                <td>{evento.espacio.nombre}</td>
                <td>{evento.fechaInicio.toLocaleString()}</td>
                <td>{evento.fechaFin.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
