"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  solicitudId?: string;
  programa?: string;
  espacio?: string;
  solicitante?: string;
  detalle?: string;
  fechaLabel?: string;
};

export function CalendarClient({
  includeSolicitudes = false,
  onSolicitudSelect,
}: {
  includeSolicitudes?: boolean;
  onSolicitudSelect?: (solicitudId: string) => void;
}) {
  return (
    <FullCalendar
      plugins={[timeGridPlugin, dayGridPlugin, listPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: "today prev,next",
        center: "title",
        right: "timeGridWeek,dayGridMonth,listWeek",
      }}
      locale={esLocale}
      buttonText={{ today: "Hoy", week: "Semana", month: "Mes", list: "Lista" }}
      nowIndicator
      selectable={false}
      height="auto"
      allDaySlot={false}
      slotMinTime="07:00:00"
      editable={false}
      eventStartEditable={false}
      eventDurationEditable={false}
      eventClick={(info) => {
        const props = info.event.extendedProps as { solicitudId?: string };
        if (props?.solicitudId && onSolicitudSelect) {
          onSolicitudSelect(props.solicitudId);
        }
      }}
      events={async (info, success, failure) => {
        try {
          const params = new URLSearchParams({ start: info.startStr, end: info.endStr });
          if (includeSolicitudes) {
            params.set("includeSolicitudes", "1");
          }
          const res = await fetch(`/api/calendar?${params.toString()}`);
          const data = await res.json();
          success(data.events ?? []);
        } catch (error) {
          failure(error as Error);
        }
      }}
    />
  );
}
