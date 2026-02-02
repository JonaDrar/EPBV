import Link from "next/link";
import styles from "../calendario-form.module.css";
import { programs } from "@/lib/programs";
import { ReservaRequestForm } from "@/components/ReservaRequestForm";

const espaciosLabels: Record<string, string> = {
  "salon-multiuso": "Salon multiuso",
  "cancha": "Cancha",
};

export default function CalendarioEspacioPage({ params }: { params: { espacio: string } }) {
  const espacioKey = params.espacio;
  const espacioLabel = espaciosLabels[espacioKey] ?? "Salón";

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <img src="/EPBV.svg" alt="Espacio por el Buen Vivir" className={styles.logo} />
          <div className={styles.breadcrumbs}>
            <Link href="/dashboard">Inicio</Link> / <Link href="/calendario">Calendario</Link> /{" "}
            <span>{espacioLabel}</span>
          </div>
        </div>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Calendario</h1>
          <div className={styles.subtitle}>{espacioLabel}</div>
        </div>
        <div style={{ width: 160 }} />
      </div>

      <div className={styles.formWrap}>
        <ReservaRequestForm espacioLabel={espacioLabel} programas={programs.map((item) => item.name)} />
      </div>
    </div>
  );
}
