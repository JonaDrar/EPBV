import Link from "next/link";
import dynamic from "next/dynamic";
import styles from "./calendario.module.css";

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

export default function CalendarioPage() {
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
            Revisa la disponibilidad de los espacios y organiza tus actividades con anticipación.
          </p>
        </div>
        <div style={{ width: 160 }} />
      </div>

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
    </div>
  );
}
