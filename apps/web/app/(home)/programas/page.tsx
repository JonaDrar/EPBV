import Link from "next/link";
import styles from "./programas.module.css";
import { programs, programRows } from "@/lib/programs";

export default function ProgramasPage() {
  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <img src="/EPBV.svg" alt="Espacio por el Buen Vivir" className={styles.logo} />
          <div className={styles.breadcrumbs}>
            <Link href="/dashboard">Inicio</Link> / <span>Programas</span>
          </div>
        </div>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Programas</h1>
          <p className={styles.subtitle}>Revisa los programas que habitan el Espacio por el Buen Vivir</p>
        </div>
        <div style={{ width: 160 }} />
      </div>

      <div className={styles.programRows}>
        <div className={`${styles.row} ${styles.rowThree}`}>
          {programRows[0].map((slug) => {
            const program = programs.find((item) => item.slug === slug);
            if (!program) return null;
            return (
              <Link key={program.slug} href={`/programas/${program.slug}`} className={styles.programItem}>
                <div className={styles.circle} />
                <div>{program.name}</div>
              </Link>
            );
          })}
        </div>
        <div className={`${styles.row} ${styles.rowFour}`}>
          {programRows[1].map((slug) => {
            const program = programs.find((item) => item.slug === slug);
            if (!program) return null;
            return (
              <Link key={program.slug} href={`/programas/${program.slug}`} className={styles.programItem}>
                <div className={styles.circle} />
                <div>{program.name}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
