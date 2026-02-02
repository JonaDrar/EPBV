"use client";

import { useState } from "react";
import styles from "@/app/(home)/calendario/calendario-form.module.css";
import { buildReservaDescription } from "@/lib/reserva-request";

type ReservaRequestFormProps = {
  espacioLabel: string;
  programas: string[];
};

function formatToday() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
}

export function ReservaRequestForm({ espacioLabel, programas }: ReservaRequestFormProps) {
  const [programa, setPrograma] = useState("");
  const [fecha, setFecha] = useState(formatToday());
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const descripcionFinal = buildReservaDescription({
      programa,
      fecha,
      espacio: espacioLabel,
      espacioKey: espacioLabel.toLowerCase().includes("cancha") ? "cancha" : "salon-multiuso",
      detalle: descripcion,
    });

    const res = await fetch("/api/solicitudes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "OTRO",
        titulo: `Reserva ${espacioLabel}`,
        descripcion: descripcionFinal,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "No se pudo enviar la solicitud");
      return;
    }

    setPrograma("");
    setFecha("");
    setDescripcion("");
    setMessage("Solicitud enviada");
  };

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div>
        <div className={styles.fieldLabel}>Programa</div>
        <div className={styles.inputWrap}>
          <select
            className={styles.select}
            value={programa}
            onChange={(event) => setPrograma(event.target.value)}
          >
            <option value="">Seleccionar</option>
            {programas.map((item) => (
              <option key={item} value={item}>
                {item}
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
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
          />
          <span className={styles.chevron}>&gt;</span>
        </div>
      </div>

      <div>
        <div className={styles.fieldLabel}>{espacioLabel}</div>
        <div className={styles.inputWrap}>
          <select className={styles.select} value={espacioLabel} disabled>
            <option>{espacioLabel}</option>
          </select>
          <span className={styles.chevron}>&gt;</span>
        </div>
      </div>

      <div>
        <div className={styles.fieldLabel}>Descripción de solicitud</div>
        <textarea
          className={styles.textarea}
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
        />
      </div>

      {message ? (
        <div style={{ fontSize: 12, color: message.includes("enviada") ? "#15803d" : "#b91c1c" }}>
          {message}
        </div>
      ) : null}

      <div className={styles.buttonRow}>
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </form>
  );
}
