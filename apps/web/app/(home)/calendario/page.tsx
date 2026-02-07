import Link from "next/link";
import dynamic from "next/dynamic";
import { prisma } from "@ebv/db";
import styles from "./calendario.module.css";
import { requireUser } from "@/lib/auth-server";
import { parseReservaDescription, parseFechaDDMMYYYY } from "@/lib/reserva-request";
import { formatDateInBusinessTime, formatTimeInBusinessTime } from "@/lib/schedule";

const CalendarClient = dynamic(
  () => import("./CalendarClient").then((mod) => mod.CalendarClient),
  { ssr: false }
);

function ArrowButton() {
  return (
    <div
      aria-hidden
      style={{
        width: 28,
        height: 22,
        borderRadius: 6,
        background: "#cc5fa7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 5h12M9 1l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Card({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className={styles.card}>
      <div>
        <div className={styles.cardTitle}>{title}</div>
        <div className={styles.cardDesc}>{description}</div>
      </div>
      <div className={styles.cardArrow}>
        <ArrowButton />
      </div>
    </Link>
  );
}

function formatRange(start: Date, end: Date) {
  return `${formatDateInBusinessTime(start)} · ${formatTimeInBusinessTime(start)} - ${formatTimeInBusinessTime(end)}`;
}

export default async function CalendarioPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  let pendingSpaceSolicitudes: Array<{
    id: string;
    title: string;
    requester: string;
    schedule: string;
  }> = [];
  let upcomingItems: Array<{
    id: string;
    title: string;
    schedule: string;
  }> = [];

  if (isAdmin) {
    const now = new Date();

    const [solicitudes, reservas, eventos] = await Promise.all([
      prisma.solicitud.findMany({
        where: {
          tipo: "OTRO",
          estado: "RECIBIDA",
        },
        include: {
          createdBy: true,
          espacioSolicitado: true,
        },
        orderBy: [{ fechaInicioSolicitada: "asc" }, { createdAt: "asc" }],
        take: 8,
      }),
      prisma.reserva.findMany({
        where: {
          estado: "ACTIVA",
          fechaInicio: { gte: now },
        },
        include: { espacio: true },
        orderBy: { fechaInicio: "asc" },
        take: 8,
      }),
      prisma.evento.findMany({
        where: { fechaInicio: { gte: now } },
        include: { espacio: true },
        orderBy: { fechaInicio: "asc" },
        take: 8,
      }),
    ]);

    pendingSpaceSolicitudes = solicitudes.map((solicitud) => {
      const meta = parseReservaDescription(solicitud.descripcion);
      const fallbackStart = parseFechaDDMMYYYY(meta?.fecha, meta?.horaInicio || "09:00");
      const fallbackEnd = parseFechaDDMMYYYY(meta?.fecha, meta?.horaFin || "10:00");
      const start = solicitud.fechaInicioSolicitada ?? fallbackStart;
      const end = solicitud.fechaFinSolicitada ?? fallbackEnd;
      const requester = solicitud.createdBy.name || solicitud.createdBy.email;
      const space = solicitud.espacioSolicitado?.nombre ?? meta?.espacio ?? "Espacio";

      return {
        id: solicitud.id,
        title: `${space} · ${meta?.programa || "Programa"}`,
        requester,
        schedule: start && end && end > start ? formatRange(start, end) : "Sin horario",
      };
    });

    upcomingItems = [
      ...reservas.map((reserva) => ({
        id: `reserva-${reserva.id}`,
        title: `Reserva • ${reserva.espacio.nombre}`,
        start: reserva.fechaInicio,
        end: reserva.fechaFin,
      })),
      ...eventos.map((evento) => ({
        id: `evento-${evento.id}`,
        title: `Evento • ${evento.titulo}`,
        start: evento.fechaInicio,
        end: evento.fechaFin,
      })),
    ]
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 8)
      .map((item) => ({
        id: item.id,
        title: item.title,
        schedule: formatRange(item.start, item.end),
      }));
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <img src="/EPBV.svg" alt="Espacio por el Buen Vivir" className={styles.logo} />
          <div className={styles.breadcrumbs}>
            <Link href="/dashboard">Inicio</Link> / <span>Calendario</span>
          </div>
        </div>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Calendario</h1>
          <p className={styles.subtitle}>
            {isAdmin
              ? "Visualiza solicitudes de espacio pendientes y próximas actividades en un solo lugar."
              : "Revisa la disponibilidad de los espacios y organiza tus actividades con anticipación."}
          </p>
        </div>
        <div style={{ width: 160 }} />
      </div>

      {isAdmin ? (
        <div className={styles.adminContent}>
          <div className={styles.calendarWrapper}>
            <div className={styles.calendarSurface}>
              <CalendarClient includeSolicitudes />
            </div>
          </div>

          <div className={styles.summaryPanel}>
            <div className={styles.summaryBlock}>
              <div className={styles.summaryTitle}>Solicitudes de espacio pendientes</div>
              {pendingSpaceSolicitudes.length === 0 ? (
                <div className={styles.summaryEmpty}>No hay solicitudes pendientes.</div>
              ) : (
                pendingSpaceSolicitudes.map((item) => (
                  <div key={item.id} className={styles.summaryItem}>
                    <div className={styles.summaryItemTitle}>{item.title}</div>
                    <div className={styles.summaryItemMeta}>{item.schedule}</div>
                    <div className={styles.summaryItemMeta}>Solicita: {item.requester}</div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.summaryBlock}>
              <div className={styles.summaryTitle}>Próximas reservas y eventos</div>
              {upcomingItems.length === 0 ? (
                <div className={styles.summaryEmpty}>Sin actividades próximas.</div>
              ) : (
                upcomingItems.map((item) => (
                  <div key={item.id} className={styles.summaryItem}>
                    <div className={styles.summaryItemTitle}>{item.title}</div>
                    <div className={styles.summaryItemMeta}>{item.schedule}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.content}>
          <div style={{ display: "grid", gap: 16 }}>
            <Card
              href="/calendario/cancha"
              title="Cancha"
              description="Revisa la disponibilidad y reserva la cancha para tus actividades."
            />
            <Card
              href="/calendario/salon-multiuso"
              title="Salones multiuso"
              description="Consulta la disponibilidad y reserva salones para talleres y actividades."
            />
          </div>
          <div className={styles.calendarWrapper}>
            <div className={styles.calendarSurface}>
              <CalendarClient />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
