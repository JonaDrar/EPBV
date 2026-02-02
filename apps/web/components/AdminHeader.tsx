import Link from "next/link";
import styles from "./admin-header.module.css";

export function AdminHeader({
  title,
  breadcrumb,
  subtitle,
}: {
  title: string;
  breadcrumb?: string;
  subtitle?: string;
}) {
  return (
    <div className={styles.top}>
      <div>
        <img src="/EPBV.svg" alt="Espacio por el Buen Vivir" className={styles.logo} />
        <div className={styles.breadcrumbs}>
          <Link href="/dashboard">Inicio</Link> / <span>{breadcrumb ?? title}</span>
        </div>
      </div>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      <div style={{ width: 160 }} />
    </div>
  );
}
