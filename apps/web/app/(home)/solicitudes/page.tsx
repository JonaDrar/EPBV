import Link from "next/link";
import { prisma } from "@ebv/db";
import styles from "./solicitudes.module.css";
import { requireUser } from "@/lib/auth-server";
import { displayReservaDescription } from "@/lib/reserva-request";

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

function NuevaSolicitudCard({
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

const estadoLabel: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  RESUELTA: "Resuelta",
  RECHAZADA: "Rechazada",
};

function getSolicitudEstadoLabel(estado: string, tipo: string) {
  if (tipo === "OTRO" && estado === "RESUELTA") {
    return "Aprobada";
  }
  return estadoLabel[estado] ?? estado;
}

export default async function SolicitudesPage() {
  const user = await requireUser();
  const solicitudes = await prisma.solicitud.findMany({
    where: { createdById: user.id },
    orderBy: { createdAt: "desc" },
  });
  type SolicitudItem = (typeof solicitudes)[number];

  const activas = solicitudes.filter(
    (s: SolicitudItem) => s.estado === "PENDIENTE" || s.estado === "EN_PROCESO"
  );
  const historial = solicitudes.filter(
    (s: SolicitudItem) => s.estado === "RESUELTA" || s.estado === "RECHAZADA"
  );

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <img src="/EPBV.svg" alt="Espacio por el Buen Vivir" className={styles.logo} />
          <div className={styles.breadcrumbs}>
            <Link href="/dashboard">Inicio</Link> / <span>Solicitud</span>
          </div>
        </div>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Solicitud</h1>
          <p className={styles.subtitle}>
            Gestiona tus solicitudes en un solo lugar: envía requerimientos, revisa su estado y accede al
            historial de soluciones.
          </p>
        </div>
        <div style={{ width: 160 }} />
      </div>

      <div className={styles.cards}>
        <NuevaSolicitudCard
          href="/solicitud/mantencion"
          title="Mantención"
          description="Solicita reparaciones y arreglos del espacio"
        />
        <NuevaSolicitudCard
          href="/solicitud/administracion"
          title="Administración"
          description="Gestiones y requerimientos administrativos."
        />
        <NuevaSolicitudCard
          href="/solicitud/difusion"
          title="Difusión"
          description="Solicita apoyo para difusión y comunicaciones"
        />
      </div>

      <div className={styles.panels}>
        <div>
          <div className={styles.panelTitle}>Solicitudes activas</div>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span>Solicitud</span>
              <span>Estado</span>
            </div>
            <div className={styles.panelBody}>
              {activas.length === 0 ? (
                <div className={styles.panelRow}>
                  <div className={styles.rowDesc}>No tienes solicitudes activas.</div>
                  <div className={styles.panelRowStatus}>
                    <span className={styles.rowMeta}>—</span>
                  </div>
                </div>
              ) : (
                <div className={styles.panelRows}>
                  {activas.map((solicitud: SolicitudItem) => (
                    <div key={solicitud.id} className={styles.panelRow}>
                      <div>
                        <div className={styles.rowTitle}>{solicitud.titulo}</div>
                        <div className={styles.rowDesc}>{displayReservaDescription(solicitud.descripcion)}</div>
                        <div className={styles.rowMeta}>
                          Estado: {getSolicitudEstadoLabel(solicitud.estado, solicitud.tipo)}
                        </div>
                      </div>
                      <div className={styles.panelRowStatus}>
                        <div className={styles.statusDots}>
                          <span className={`${styles.dot} ${styles.dotGreen}`} />
                          <span className={`${styles.dot} ${styles.dotOrange}`} />
                          <span className={`${styles.dot} ${styles.dotPink}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className={styles.panelTitle}>Historial de solicitudes</div>
          <div className={styles.panel}>
            <div className={styles.historyHeader}>
              <span>Solicitud</span>
              <span>Solución</span>
            </div>
            <div className={styles.historyBody}>
              {historial.length === 0 ? (
                <div className={styles.historyRow}>
                  <div className={styles.rowDesc}>Aún no tienes solicitudes cerradas.</div>
                  <div className={styles.historyRowSolution}>
                    <span className={styles.solution}>—</span>
                  </div>
                </div>
              ) : (
                <div className={styles.historyRows}>
                  {historial.map((solicitud) => (
                    <div key={solicitud.id} className={styles.historyRow}>
                      <div>
                        <div className={styles.rowTitle}>{solicitud.titulo}</div>
                        <div className={styles.rowDesc}>{displayReservaDescription(solicitud.descripcion)}</div>
                      </div>
                      <div className={styles.historyRowSolution}>
                        <div className={styles.solution}>
                          {getSolicitudEstadoLabel(solicitud.estado, solicitud.tipo)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
