import Link from "next/link";
import styles from "./administracion.module.css";

const teamMembers = [
  {
    name: "Fabian Lizana",
    role: "Apoyo administrativo del\nEspacio por el Buen Vivir",
  },
  {
    name: "Valentina Hernández",
    role: "Apoyo administrativo del\nEspacio por el Buen Vivir",
  },
  {
    name: "Heriberto Tapia",
    role: "Artista\ndel Espacio por el Buen Vivir",
  },
  {
    name: "José Vejar",
    role: "Mantención\ndel Espacio por el Buen Vivir",
  },
];

export default function AdministracionPage() {
  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <img src="/EPBV.svg" alt="Espacio por el Buen Vivir" className={styles.logo} />
          <div className={styles.breadcrumbs}>
            <Link href="/dashboard">Inicio</Link> / <span>Administración</span>
          </div>
        </div>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Administración</h1>
          <p className={styles.subtitle}>
            Conoce al equipo de administración del Espacio por el Buen Vivir
            <br />
            Contacto: <strong>jcornejog@mpudahuel.cl</strong>
          </p>
        </div>
        <div style={{ width: 160 }} />
      </div>

      <div className={styles.team}>
        <div className={styles.centerMember}>
          <div className={styles.circle} />
          <div className={styles.memberName}>Josue Cornejo</div>
          <div className={styles.memberRole}>Administrador del Espacio por el Buen Vivir</div>
        </div>

        <div className={styles.memberRow}>
          {teamMembers.map((member) => (
            <div key={member.name} className={styles.member}>
              <div className={styles.circle} />
              <div className={styles.memberName}>{member.name}</div>
              <div className={styles.memberRole} style={{ whiteSpace: "pre-line" }}>
                {member.role}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
