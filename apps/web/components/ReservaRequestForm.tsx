"use client";

import { useMemo, useState } from "react";
import styles from "@/app/(home)/calendario/calendario-form.module.css";
import { buildReservaDescription } from "@/lib/reserva-request";
import { toDateInputInBusinessTime } from "@/lib/schedule";

type ReservaRequestFormProps = {
  espacioLabel: string;
  programas: string[];
  espacios: Array<{ id: string; nombre: string }>;
};

function formatTodayDDMMYYYY() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateInputToDDMMYYYY(input: string) {
  const [year, month, day] = input.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

export function ReservaRequestForm({ espacioLabel, programas, espacios }: ReservaRequestFormProps) {
  const [programa, setPrograma] = useState("");
  const [fechaIngreso] = useState(formatTodayDDMMYYYY());
  const [fechaEvento, setFechaEvento] = useState(toDateInputInBusinessTime(new Date()));
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("10:00");
  const [espacioSolicitadoId, setEspacioSolicitadoId] = useState(espacios[0]?.id ?? "");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedEspacio = useMemo(
    () => espacios.find((item) => item.id === espacioSolicitadoId) ?? null,
    [espacioSolicitadoId, espacios]
  );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!espacioSolicitadoId || !fechaEvento || !horaInicio || !horaFin) {
      setLoading(false);
      setMessage("Debes completar espacio, fecha y horario");
      return;
    }

    const descripcionFinal = buildReservaDescription({
      programa,
      fecha: formatDateInputToDDMMYYYY(fechaEvento),
      horaInicio,
      horaFin,
      espacio: selectedEspacio?.nombre ?? espacioLabel,
      espacioKey: selectedEspacio?.nombre?.toLowerCase()?.includes("cancha")
        ? "cancha"
        : "salon-multiuso",
      espacioId: espacioSolicitadoId,
      detalle: descripcion,
    });

    const res = await fetch("/api/solicitudes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "OTRO",
        titulo: `Reserva ${selectedEspacio?.nombre ?? espacioLabel}`,
        descripcion: descripcionFinal,
        espacioSolicitadoId,
        fecha: fechaEvento,
        horaInicio,
        horaFin,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "No se pudo enviar la solicitud");
      return;
    }

    setPrograma("");
    setHoraInicio("09:00");
    setHoraFin("10:00");
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
            aria-label="Programa"
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
            value={fechaIngreso}
            readOnly
            aria-readonly
            aria-label="Fecha de ingreso solicitud"
          />
          <span className={styles.chevron}>&gt;</span>
        </div>
      </div>

      <div>
        <div className={styles.fieldLabel}>Espacio solicitado</div>
        <div className={styles.inputWrap}>
          <select
            className={styles.select}
            value={espacioSolicitadoId}
            onChange={(event) => setEspacioSolicitadoId(event.target.value)}
            required
            aria-label="Espacio solicitado"
          >
            {espacios.length === 0 ? <option value="">Sin espacios activos</option> : null}
            {espacios.map((espacio) => (
              <option key={espacio.id} value={espacio.id}>
                {espacio.nombre}
              </option>
            ))}
          </select>
          <span className={styles.chevron}>&gt;</span>
        </div>
      </div>

      <div>
        <div className={styles.fieldLabel}>Fecha del evento</div>
        <div className={styles.inputWrap}>
          <input
            type="date"
            className={styles.input}
            value={fechaEvento}
            onChange={(event) => setFechaEvento(event.target.value)}
            required
            aria-label="Fecha del evento"
          />
          <span className={styles.chevron}>&gt;</span>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <div className={styles.fieldLabel}>Hora inicio</div>
          <div className={styles.inputWrap}>
            <input
              type="time"
              className={styles.input}
              value={horaInicio}
              onChange={(event) => setHoraInicio(event.target.value)}
              required
              aria-label="Hora inicio"
            />
            <span className={styles.chevron}>&gt;</span>
          </div>
        </div>
        <div>
          <div className={styles.fieldLabel}>Hora término</div>
          <div className={styles.inputWrap}>
            <input
              type="time"
              className={styles.input}
              value={horaFin}
              onChange={(event) => setHoraFin(event.target.value)}
              required
            aria-label="Hora termino"
            />
            <span className={styles.chevron}>&gt;</span>
          </div>
        </div>
      </div>

      <div>
        <div className={styles.fieldLabel}>Descripción de solicitud</div>
        <textarea
          className={styles.textarea}
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          aria-label="Descripcion de solicitud"
        />
      </div>

      {message ? (
        <div style={{ fontSize: 12, color: message.includes("enviada") ? "#15803d" : "#b91c1c" }}>
          {message}
        </div>
      ) : null}

      <div className={styles.buttonRow}>
        <button type="submit" className={styles.submit} disabled={loading || espacios.length === 0}>
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </form>
  );
}
