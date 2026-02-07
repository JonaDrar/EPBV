"use client";

import { useState } from "react";
import { parseReservaDescription } from "@/lib/reserva-request";
import { CalendarClient } from "@/app/(home)/calendario/CalendarClient";
import { formatDateInBusinessTime, formatTimeInBusinessTime } from "@/lib/schedule";
import styles from "./solicitudes-admin.module.css";

type PendingSolicitud = {
  id: string;
  titulo: string;
  descripcion: string;
  createdAt: string;
  createdByEmail: string;
  createdByName?: string | null;
  fechaInicioSolicitada: string | null;
  fechaFinSolicitada: string | null;
  espacioSolicitadoNombre: string | null;
};

function formatRequester(name: string | null | undefined, email: string) {
  const cleanName = name?.trim();
  if (cleanName) return cleanName;
  const [local] = email.split("@");
  if (!local) return email;
  const readable = local.replace(/[._-]+/g, " ").trim();
  return readable || email;
}

function formatSchedule(item: PendingSolicitud) {
  const startDate = item.fechaInicioSolicitada ? new Date(item.fechaInicioSolicitada) : null;
  const endDate = item.fechaFinSolicitada ? new Date(item.fechaFinSolicitada) : null;

  if (startDate && endDate) {
    return `${formatDateInBusinessTime(startDate)} · ${formatTimeInBusinessTime(startDate)} - ${formatTimeInBusinessTime(endDate)}`;
  }

  const meta = parseReservaDescription(item.descripcion);
  if (meta?.fecha) {
    const start = meta.horaInicio || "09:00";
    const end = meta.horaFin || "10:00";
    return `${meta.fecha} · ${start} - ${end}`;
  }

  return "Sin horario";
}

export function AdminSolicitudesClient({ pendientes }: { pendientes: PendingSolicitud[] }) {
  const [items, setItems] = useState<PendingSolicitud[]>(pendientes);
  const [selectedId, setSelectedId] = useState<string | null>(pendientes[0]?.id ?? null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [calendarKey, setCalendarKey] = useState(0);
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  const onDecision = async (id: string, estado: "APROBADA" | "RECHAZADA") => {
    setLoadingId(id);
    setErrorById((prev) => ({ ...prev, [id]: "" }));

    const res = await fetch(`/api/solicitudes/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });

    setLoadingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrorById((prev) => ({
        ...prev,
        [id]: data.error ?? "No se pudo actualizar la solicitud",
      }));
      return;
    }

    setItems((prev) => {
      const nextItems = prev.filter((item) => item.id !== id);
      setSelectedId((current) => (current === id ? nextItems[0]?.id ?? null : current));
      return nextItems;
    });
    setCalendarKey((value) => value + 1);
  };

  return (
    <div className={styles.adminSection}>
      <div className={styles.adminGrid}>
        <div className={styles.listPanel}>
          <div className={styles.sectionTitle}>Solicitudes pendientes</div>
          <div className={styles.list}>
            {items.length === 0 ? (
              <div className={styles.emptyState}>No hay solicitudes pendientes.</div>
            ) : null}
            {items.map((item) => {
              const meta = parseReservaDescription(item.descripcion);
              const programa = meta?.programa?.trim() || "Programa sin definir";
              const espacio = item.espacioSolicitadoNombre || meta?.espacio?.trim() || "Espacio sin definir";
              const schedule = formatSchedule(item);
              const requester = formatRequester(item.createdByName, item.createdByEmail);
              const detalle = meta?.detalle?.trim();
              const error = errorById[item.id];

              return (
                <div
                  key={item.id}
                  className={`${styles.listItem} ${selectedId === item.id ? styles.listItemActive : ""}`}
                  data-testid={`pending-solicitud-${item.id}`}
                  onClick={() => setSelectedId(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(item.id);
                    }
                  }}
                >
                  <div className={styles.listTitle}>{programa}</div>
                  <div className={styles.listMeta}>Espacio: {espacio}</div>
                  <div className={styles.listMeta}>Horario: {schedule}</div>
                  <div className={styles.listMeta}>
                    Solicitante: {requester} ({item.createdByEmail})
                  </div>
                  {detalle ? <div className={styles.listDetail}>{detalle}</div> : null}
                  {error ? <div className={styles.errorText}>{error}</div> : null}
                  <div className={styles.listActions}>
                    <button
                      type="button"
                      className={styles.actionApprove}
                      data-testid={`approve-solicitud-${item.id}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDecision(item.id, "APROBADA");
                      }}
                      disabled={loadingId === item.id}
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      className={styles.actionReject}
                      data-testid={`reject-solicitud-${item.id}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDecision(item.id, "RECHAZADA");
                      }}
                      disabled={loadingId === item.id}
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.calendarColumn}>
          <div className={styles.calendarWrapper}>
            <div className={styles.calendarSurface}>
              <CalendarClient
                key={calendarKey}
                includeSolicitudes
                onSolicitudSelect={(id) => setSelectedId(id)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
