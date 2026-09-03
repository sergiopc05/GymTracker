// Utilidades de fecha. Todo en hora local del dispositivo.

export const WEEKDAY_LONG = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export const WEEKDAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** 0 = lunes ... 6 = domingo (JS usa 0 = domingo). */
export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** Fecha ISO local "YYYY-MM-DD" (sin desfase de zona horaria). */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Convierte "YYYY-MM-DD" en un Date a medianoche local. */
export function parseIso(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Lunes (00:00) de la semana que contiene `d`. */
export function startOfWeek(d: Date): Date {
  return addDays(d, -mondayIndex(d));
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const longFormatter = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** "Martes, 2 de septiembre" */
export function formatLongDate(d: Date): string {
  return capitalize(longFormatter.format(d));
}

const shortFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
});

/** "2 sept" — compacto para listas. */
export function formatShortDate(d: Date): string {
  return shortFormatter.format(d);
}

const monthFormatter = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
});

/** "Septiembre 2026" */
export function formatMonth(d: Date): string {
  return capitalize(monthFormatter.format(d).replace(" de ", " "));
}
