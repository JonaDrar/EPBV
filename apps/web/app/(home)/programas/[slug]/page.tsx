import Link from "next/link";
import { prisma } from "@ebv/db";
import styles from "./programa.module.css";
import { getProgramBySlug } from "@/lib/programs";

function formatDate(date: Date) {
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ProgramaPage({ params }: { params: { slug: string } }) {
  const program = getProgramBySlug(params.slug);
  const now = new Date();

  if (!program) {
    return (
      <div className={styles.page}>
        <div className={styles.top}>
          <div>
            <img src="/EPBV.svg" alt="Espacio por el Buen Vivir" className={styles.logo} />
            <div className={styles.breadcrumbs}>
              <Link href="/dashboard">Inicio</Link> / <Link href="/programas">Programas</Link> /{" "}
              <span>Programa</span>
            </div>
          </div>
        </div>
        <div className={styles.empty}>Programa no encontrado.</div>
      </div>
    );
  }

  const upcomingEventos = await prisma.evento.findMany({
    where: {
      fechaInicio: { gte: now },
      OR: [
        { programaSlug: program.slug },
        { titulo: { contains: program.name, mode: "insensitive" } },
        { descripcion: { contains: program.name, mode: "insensitive" } },
      ],
    },
    orderBy: { fechaInicio: "asc" },
    take: 5,
  });

  const solicitudes = await prisma.solicitud.findMany({
    where: {
      tipo: "OTRO",
      estado: "RESUELTA",
      descripcion: { contains: `programa=${program.name}`, mode: "insensitive" },
    },
    select: { id: true, titulo: true },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  type SolicitudItem = (typeof solicitudes)[number];

  const solicitudIds = solicitudes.map((solicitud: SolicitudItem) => solicitud.id);
  const auditLogs = solicitudIds.length
    ? await prisma.auditLog.findMany({
        where: {
          entityType: "SOLICITUD",
          entityId: { in: solicitudIds },
          action: "RESERVA_AUTO_CREATED",
        },
      })
    : [];
  type AuditLogItem = (typeof auditLogs)[number];

  const reservaIds = auditLogs
    .map((log: AuditLogItem) => (log.after as { reservaId?: string } | null)?.reservaId)
    .filter((id): id is string => Boolean(id));

  const reservas = reservaIds.length
    ? await prisma.reserva.findMany({
        where: {
          id: { in: reservaIds },
          estado: "ACTIVA",
          fechaInicio: { gte: now },
        },
        include: { espacio: true },
        orderBy: { fechaInicio: "asc" },
      })
    : [];

  const upcomingActivities = [
    ...upcomingEventos.map((evento) => ({
      id: `evento-${evento.id}`,
      title: evento.titulo,
      start: evento.fechaInicio,
    })),
    ...reservas.map((reserva) => ({
      id: `reserva-${reserva.id}`,
      title: `Reserva confirmada • ${reserva.espacio.nombre}`,
      start: reserva.fechaInicio,
    })),
  ]
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 5);

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <img src="/EPBV.svg" alt="Espacio por el Buen Vivir" className={styles.logo} />
          <div className={styles.breadcrumbs}>
            <Link href="/dashboard">Inicio</Link> / <Link href="/programas">Programas</Link> /{" "}
            <span>{program.name}</span>
          </div>
        </div>
      </div>

      <div className={styles.header}>
        <div className={styles.circle} />
        <h1 className={styles.title}>{program.name}</h1>
        <div className={styles.contact}>Contacto: {program.contact}</div>
        <p className={styles.description}>{program.description}</p>
      </div>

      <div className={styles.content}>
        <div>
          <div className={styles.coordinator}>
            <div className={styles.coordinatorCircle} />
            <div>
              <div className={styles.coordinatorName}>{program.coordinator.name}</div>
              <div className={styles.coordinatorRole}>{program.coordinator.role}</div>
            </div>
          </div>

          <div className={styles.teamCard}>
            <div className={styles.teamTitle}>Equipo</div>
            <div className={styles.teamDivider} />
            {program.team.map((member) => (
              <div key={member.name} className={styles.teamMember}>
                <div className={styles.teamName}>{member.name}</div>
                <div className={styles.teamRole}>{member.role}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className={styles.activitiesTitle}>Proximas actividades</div>
          {upcomingActivities.length === 0 ? (
            <div className={styles.empty}>Sin actividades próximas.</div>
          ) : (
            upcomingActivities.map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={styles.activityName}>{activity.title}</div>
                <div className={styles.activityMeta}>
                  {formatDate(activity.start)} · {formatTime(activity.start)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
