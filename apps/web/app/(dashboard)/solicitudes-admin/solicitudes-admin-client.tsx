"use client";

import { useState } from "react";
import { parseReservaDescription } from "@/lib/reserva-request";
import { CalendarClient } from "@/app/(home)/calendario/CalendarClient";
import styles from "./solicitudes-admin.module.css";

type PendingSolicitud = {
  id: string;
  titulo: string;
  descripcion: string;
  createdAt: string;
  createdByEmail: string;
  createdByName?: string | null;
};

function formatRequester(name: string | null | undefined, email: string) {
  const cleanName = name?.trim();
  if (cleanName) return cleanName;
  const [local] = email.split("@");
  if (!local) return email;
  const readable = local.replace(/[._-]+/g, " ").trim();
  return readable || email;
}

export function AdminSolicitudesClient({ pendientes }: { pendientes: PendingSolicitud[] }) {
  const [items, setItems] = useState<PendingSolicitud[]>(pendientes);
  const [selectedId, setSelectedId] = useState<string | null>(pendientes[0]?.id ?? null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [calendarKey, setCalendarKey] = useState(0);

  const onDecision = async (id: string, estado: "RESUELTA" | "RECHAZADA") => {
    setLoadingId(id);
    await fetch(`/api/solicitudes/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    setItems((prev) => {
      const nextItems = prev.filter((item) => item.id !== id);
      setSelectedId((current) => (current === id ? nextItems[0]?.id ?? null : current));
      return nextItems;
    });
    setCalendarKey((value) => value + 1);
    setLoadingId(null);
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
              const espacio = meta?.espacio?.trim() || "Espacio sin definir";
              const fecha = meta?.fecha?.trim() || "Sin fecha";
              const requester = formatRequester(item.createdByName, item.createdByEmail);
              const detalle = meta?.detalle?.trim();
              return (
                <div
                  key={item.id}
                  className={`${styles.listItem} ${selectedId === item.id ? styles.listItemActive : ""}`}
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
                  <div className={styles.listMeta}>Fecha: {fecha}</div>
                  <div className={styles.listMeta}>
                    Solicitante: {requester} ({item.createdByEmail})
                  </div>
                  {detalle ? <div className={styles.listDetail}>{detalle}</div> : null}
                  <div className={styles.listActions}>
                    <button
                      type="button"
                      className={styles.actionApprove}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDecision(item.id, "RESUELTA");
                      }}
                      disabled={loadingId === item.id}
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      className={styles.actionReject}
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
