export const BUSINESS_TIME_ZONE = "America/Santiago";

type DateParts = {
  year: number;
  month: number;
  day: number;
};

type TimeParts = {
  hour: number;
  minute: number;
};

function parseDateInput(input: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function parseTimeInput(input: string): TimeParts | null {
  const match = /^(\d{2}):(\d{2})$/.exec(input);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  const asUTC = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return asUTC - date.getTime();
}

function zonedDateTimeToUtc(parts: DateParts & TimeParts, timeZone: string) {
  const utcGuess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0)
  );

  const firstOffset = getTimeZoneOffsetMs(utcGuess, timeZone);
  let result = new Date(utcGuess.getTime() - firstOffset);

  // One extra pass handles DST boundaries reliably.
  const secondOffset = getTimeZoneOffsetMs(result, timeZone);
  if (secondOffset !== firstOffset) {
    result = new Date(utcGuess.getTime() - secondOffset);
  }

  return result;
}

export function parseBusinessDateTimeToUtc(dateInput: string, timeInput: string) {
  const date = parseDateInput(dateInput);
  const time = parseTimeInput(timeInput);
  if (!date || !time) return null;

  return zonedDateTimeToUtc({ ...date, ...time }, BUSINESS_TIME_ZONE);
}

export function parseBusinessDateRangeToUtc(
  dateInput: string,
  startTimeInput: string,
  endTimeInput: string
) {
  const start = parseBusinessDateTimeToUtc(dateInput, startTimeInput);
  const end = parseBusinessDateTimeToUtc(dateInput, endTimeInput);
  if (!start || !end) {
    return { ok: false as const, error: "Fecha u hora inválida" };
  }
  if (end <= start) {
    return { ok: false as const, error: "Hora término debe ser posterior a hora inicio" };
  }

  return { ok: true as const, start, end };
}

export function formatDateInBusinessTime(date: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: BUSINESS_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatTimeInBusinessTime(date: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: BUSINESS_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function toDateInputInBusinessTime(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}`;
}
