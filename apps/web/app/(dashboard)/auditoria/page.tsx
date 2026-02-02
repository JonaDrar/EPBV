import { prisma } from "@ebv/db";
import { requireUser } from "@/lib/auth-server";
import { AdminHeader } from "@/components/AdminHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuditoriaPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    return <div>Sin permisos para ver auditoría.</div>;
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actorUser: true },
  });
  type LogItem = (typeof logs)[number];


  return (
    <div>
      <AdminHeader
        title="Auditoría"
        subtitle="Registro de trazabilidad legal y acciones del sistema."
      />
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
              <th>Fecha</th>
              <th>Actor</th>
              <th>Entidad</th>
              <th>Acción</th>
              <th>ID Entidad</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: LogItem) => (
              <tr key={log.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td>{log.createdAt.toLocaleString()}</td>
                <td>{log.actorUser?.email ?? "-"}</td>
                <td>{log.entityType}</td>
                <td>{log.action}</td>
                <td style={{ fontSize: 12, color: "var(--muted)" }}>{log.entityId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
