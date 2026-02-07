import Link from "next/link";
import styles from "../solicitud-form.module.css";
import { programs } from "@/lib/programs";

const tipoLabels: Record<string, string> = {
  MANTENCION: "Mantención",
  ADMINISTRACION: "Administración",
  DIFUSION: "Difusión",
};

export default function SolicitudTipoPage({ params }: { params: { tipo: string } }) {
  const tipo = params.tipo.toUpperCase();
  const tipoLabel = tipoLabels[tipo] ?? "Solicitud";
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;
  const isPending = tipo === "ADMINISTRACION" || tipo === "DIFUSION";

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <img src="/EPBV.svg" alt="Espacio por el Buen Vivir" className={styles.logo} />
          <div className={styles.breadcrumbs}>
            <Link href="/dashboard">Inicio</Link> / <Link href="/solicitudes">Solicitud</Link> /{" "}
            <span>{tipoLabel}</span>
          </div>
        </div>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Solicitud</h1>
          <div className={styles.subtitle}>{tipoLabel}</div>
        </div>
        <div style={{ width: 160 }} />
      </div>

      <div className={styles.formWrap}>
        {isPending ? (
          <div style={{ width: "100%", textAlign: "center" }}>
            <img
              src="/not-implemented.png"
              alt="Pantalla en definición"
              style={{ maxWidth: 520, width: "100%", height: "auto" }}
            />
          </div>
        ) : (
          <form className={styles.form}>
          <div>
            <div className={styles.fieldLabel}>Programa</div>
            <div className={styles.inputWrap}>
              <select className={styles.select}>
                <option>Seleccionar</option>
                {programs.map((programa) => (
                  <option key={programa.slug} value={programa.name}>
                    {programa.name}
                  </option>
                ))}
              </select>
              <span className={styles.chevron}>&gt;</span>
            </div>
          </div>

          <div>
            <div className={styles.fieldLabel}>Fecha de ingreso solicitud</div>
            <div className={styles.inputWrap}>
              <input
                type="text"
                className={styles.input}
                value={formattedDate}
                readOnly
                aria-readonly
                inputMode="numeric"
                placeholder="DD/MM/AAAA"
              />
              <span className={styles.chevron}>&gt;</span>
            </div>
          </div>

          <div>
            <div className={styles.fieldLabel}>Tipo de mantención</div>
            <div className={styles.inputWrap}>
              <select className={styles.select}>
                <option>Seleccionar</option>
                <option>Eléctrica</option>
                <option>Gasfitería</option>
                <option>General</option>
              </select>
              <span className={styles.chevron}>&gt;</span>
            </div>
          </div>

          <div>
            <div className={styles.fieldLabel}>Descripción de solicitud</div>
            <textarea className={styles.textarea} />
          </div>

          <div className={styles.buttonRow}>
            <button type="submit" className={styles.submit}>Enviar</button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
