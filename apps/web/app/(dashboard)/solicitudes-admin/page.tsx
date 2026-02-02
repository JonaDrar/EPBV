import { prisma } from "@ebv/db";
import { requireUser } from "@/lib/auth-server";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminSolicitudesClient } from "./solicitudes-admin-client";

export default async function SolicitudesAdminPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    return <div>Sin permisos para gestionar solicitudes.</div>;
  }

  const solicitudes = await prisma.solicitud.findMany({
    where: {
      tipo: "OTRO",
      estado: "PENDIENTE",
    },
    include: {
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
  });
  type SolicitudItem = (typeof solicitudes)[number];

  const pendientes = solicitudes.map((solicitud: SolicitudItem) => ({
    id: solicitud.id,
    titulo: solicitud.titulo,
    descripcion: solicitud.descripcion,
    createdAt: solicitud.createdAt.toISOString(),
    createdByEmail: solicitud.createdBy.email,
    createdByName: solicitud.createdBy.name,
  }));

  return (
    <div>
      <AdminHeader
        title="Solicitudes de espacios"
        breadcrumb="Solicitudes admin"
        subtitle="Revisa solicitudes pendientes, visualízalas en el calendario y aprueba o rechaza."
      />
      <AdminSolicitudesClient pendientes={pendientes} />
    </div>
  );
}
