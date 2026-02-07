import Link from "next/link";
import { prisma } from "@ebv/db";
import { requireUser } from "@/lib/auth-server";
import styles from "./home.module.css";

function ArrowButton() {
  return (
    <div
      aria-hidden
      style={{
        width: 28,
        height: 22,
        borderRadius: 6,
        background: "#CB69A6",
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

function CardIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.cardIcon}>
      {children}
    </div>
  );
}

function HomeCard({
  href,
  title,
  description,
  icon,
  badgeCount,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badgeCount?: number;
}) {
  return (
    <Link
      href={href}
      className={styles.card}
    >
      <CardIcon>{icon}</CardIcon>
      {typeof badgeCount === "number" && badgeCount > 0 ? (
        <span className={styles.cardBadge} aria-label={`${badgeCount} solicitudes pendientes`}>
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      ) : null}
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

function Icon({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className={styles.icon} />;
}

export default async function HomePage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const pendingCount = isAdmin
    ? await prisma.solicitud.count({
        where: { tipo: "OTRO", estado: "RECIBIDA" },
      })
    : 0;

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: 18 }}>
        <img
          src="/EPBV.svg"
          alt="Espacio por el Buen Vivir"
          style={{ width: 160, height: "auto" }}
        />
      </div>

      <div className={styles.hero}>
        <h1
          className={styles.heroTitle}
        >
          Bienvenida/o al
          <br />
          Espacio por el Buen Vivir.
        </h1>
        <p className={styles.heroSubtitle}>
          Aquí podrás gestionar solicitudes, reservar espacios y acceder a información relevante
          de forma simple y ordenada.
        </p>
      </div>

      <div className={styles.grid}>
        {isAdmin ? (
          <>
            <HomeCard
              href="/solicitudes-admin"
              title="Panel Admin"
              description="Aprueba solicitudes pendientes y gestiona el sistema."
              icon={<Icon src="/icons/administracion.svg" alt="Panel Admin" />}
              badgeCount={pendingCount}
            />
            <HomeCard
              href="/usuarios"
              title="Usuarios"
              description="Crea usuarios, cambia roles y resetea contraseñas."
              icon={<Icon src="/icons/administracion.svg" alt="Usuarios" />}
            />
            <HomeCard
              href="/auditoria"
              title="Auditoría"
              description="Revisa la trazabilidad legal y acciones del sistema."
              icon={<Icon src="/icons/administracion.svg" alt="Auditoría" />}
            />
            <HomeCard
              href="/espacios"
              title="Espacios"
              description="Gestiona espacios, tipos y disponibilidad."
              icon={<Icon src="/icons/calendario.svg" alt="Espacios" />}
            />
            <HomeCard
              href="/reservas"
              title="Reservas"
              description="Listado y control de reservas activas."
              icon={<Icon src="/icons/calendario.svg" alt="Reservas" />}
            />
            <HomeCard
              href="/eventos"
              title="Eventos"
              description="Administra la agenda de eventos."
              icon={<Icon src="/icons/calendario.svg" alt="Eventos" />}
            />
          </>
        ) : null}
        <HomeCard
          href="/solicitudes"
          title="Solicitud"
          description="Ingresa, revisa, gestiona tus solicitudes aquí."
          icon={<Icon src="/icons/solicitud.svg" alt="Solicitud" />}
        />
        <HomeCard
          href="/calendario"
          title="Calendario"
          description="Agenda, revisa, gestiona tu calendario aquí."
          icon={<Icon src="/icons/calendario.svg" alt="Calendario" />}
        />
        <HomeCard
          href="/programas"
          title="Programas"
          description="Conoce los programas y sus colaboradores."
          icon={<Icon src="/icons/programas.svg" alt="Programas" />}
        />
        <HomeCard
          href="/administracion"
          title="Administración"
          description="Conoce al equipo de administración del espacio."
          icon={<Icon src="/icons/administracion.svg" alt="Administración" />}
        />
      </div>
    </div>
  );
}
