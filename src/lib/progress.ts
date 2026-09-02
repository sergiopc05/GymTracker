// Calculo de progreso y racha a partir de la rutina + los logs.

import type { DayLog, DayPlan, Routine } from "../types";
import { addDays, isoDate, mondayIndex, startOfToday } from "./dates";

const EMPTY_LOG: DayLog = { gym: {}, runs: {} };

export function getDayPlan(routine: Routine, date: Date): DayPlan {
  return routine.days[mondayIndex(date)];
}

export function getLog(logs: Record<string, DayLog>, date: Date): DayLog {
  return logs[isoDate(date)] ?? EMPTY_LOG;
}

export interface DayProgress {
  done: number;
  total: number;
  /** true si el dia esta cubierto: descanso, o todo hecho, o nada planificado. */
  complete: boolean;
  /** true si hay algo planificado (no descanso y con ejercicios/carreras). */
  hasPlan: boolean;
}

export function dayProgress(plan: DayPlan, log: DayLog): DayProgress {
  if (plan.rest) {
    return { done: 0, total: 0, complete: true, hasPlan: false };
  }
  const total = plan.gym.length + plan.runs.length;
  let done = 0;
  for (const ex of plan.gym) if (log.gym[ex.id]) done++;
  for (const run of plan.runs) if (log.runs[run.id]) done++;
  return {
    done,
    total,
    complete: total === 0 ? true : done === total,
    hasPlan: total > 0,
  };
}

/**
 * Racha actual: numero de dias consecutivos "completos" contando hacia atras.
 * El dia de hoy no rompe la racha si aun no esta completo (todavia da tiempo).
 */
export function currentStreak(
  routine: Routine,
  logs: Record<string, DayLog>,
  today: Date = startOfToday(),
): number {
  const isComplete = (d: Date) =>
    dayProgress(getDayPlan(routine, d), getLog(logs, d)).complete;

  let cursor = isComplete(today) ? today : addDays(today, -1);
  let streak = 0;
  // Limite de seguridad: 2 anios.
  for (let i = 0; i < 730; i++) {
    if (!isComplete(cursor)) break;
    // Solo cuentan como racha los dias que realmente tenian plan.
    const plan = getDayPlan(routine, cursor);
    const prog = dayProgress(plan, getLog(logs, cursor));
    if (prog.hasPlan) streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Numero de dias con al menos un plan y todo completado (para "sesiones totales"). */
export function completedSessions(
  routine: Routine,
  logs: Record<string, DayLog>,
): number {
  let count = 0;
  for (const iso of Object.keys(logs)) {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const plan = getDayPlan(routine, date);
    const prog = dayProgress(plan, getLog(logs, date));
    if (prog.hasPlan && prog.complete) count++;
  }
  return count;
}
