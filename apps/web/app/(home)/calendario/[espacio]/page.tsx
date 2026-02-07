import Link from "next/link";
import { prisma } from "@ebv/db";
import styles from "../calendario-form.module.css";
import { programs } from "@/lib/programs";
import { ReservaRequestForm } from "@/components/ReservaRequestForm";

const espaciosLabels: Record<string, string> = {
  "salon-multiuso": "Salon multiuso",
  "cancha": "Cancha",
};

const espaciosTipo: Record<string, "SALON" | "CANCHA"> = {
  "salon-multiuso": "SALON",
  cancha: "CANCHA",
};

export default async function CalendarioEspacioPage({ params }: { params: { espacio: string } }) {
  const espacioKey = params.espacio;
  const espacioLabel = espaciosLabels[espacioKey] ?? "Salón";
  const tipo = espaciosTipo[espacioKey] ?? "SALON";

  const espacios = await prisma.espacio.findMany({
    where: {
      tipo,
      activo: true,
    },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
    },
  });

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
        {espacios.length === 0 ? (
          <div style={{ fontSize: 14, color: "#7b7b7b" }}>
            No hay espacios activos para este tipo.
          </div>
        ) : (
          <ReservaRequestForm
            espacioLabel={espacioLabel}
            programas={programs.map((item) => item.name)}
            espacios={espacios}
          />
        )}
      </div>
    </div>
  );
}
