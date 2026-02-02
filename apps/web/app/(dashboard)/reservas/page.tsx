import { prisma } from "@ebv/db";
import { requireUser } from "@/lib/auth-server";
import { AdminHeader } from "@/components/AdminHeader";
import { ReservaForm } from "@/components/ReservaForm";
import { ReservaCancelButton } from "@/components/ReservaCancelButton";

export default async function ReservasPage() {
  const user = await requireUser();
  const espacios = await prisma.espacio.findMany({ where: { activo: true } });
  type EspacioItem = (typeof espacios)[number];
  const reservas = await prisma.reserva.findMany({
    include: { espacio: true, usuario: true },
    orderBy: { fechaInicio: "asc" },
  });
  type ReservaItem = (typeof reservas)[number];

  return (
    <div>
      <AdminHeader
        title="Reservas"
        subtitle="Gestiona reservas activas y revisa el calendario simple."
      />
      {espacios.length === 0 ? (
        <div style={{ marginBottom: 16, color: "var(--muted)" }}>
          No hay espacios activos para reservar.
        </div>
      ) : (
        <ReservaForm
          espacios={espacios.map((espacio: EspacioItem) => ({ id: espacio.id, nombre: espacio.nombre }))}
        />
      )}
      <div style={{
        padding: 16,
        borderRadius: 12,
        background: "var(--panel)",
        border: "1px solid var(--border)",
      }}>
        <h3 style={{ marginTop: 0 }}>Calendario simple</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 12 }}>
              <th>Espacio</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
              <th>Responsable</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reservas.map((reserva: ReservaItem) => (
              <tr key={reserva.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td>{reserva.espacio.nombre}</td>
                <td>{reserva.fechaInicio.toLocaleString()}</td>
                <td>{reserva.fechaFin.toLocaleString()}</td>
                <td>{reserva.estado}</td>
                <td>{reserva.usuario.email}</td>
                <td>
                  {reserva.estado === "ACTIVA" ? (
                    user.role === "ADMIN" || reserva.usuarioId === user.id ? (
                      <ReservaCancelButton reservaId={reserva.id} />
                    ) : null
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
