// Cálculo de progreso y racha a partir de plantillas + asignación semanal + logs.

import type { DayLog, Exercise, Store, Template } from "../types";
import { addDays, isoDate, mondayIndex, startOfToday } from "./dates";

export interface ResolvedDay {
  iso: string;
  /** Plantilla asignada a ese día (null = descanso). */
  template: Template | null;
  /** Log guardado para esa fecha, si existe. */
  log: DayLog | null;
}

export function resolveDay(store: Store, date: Date): ResolvedDay {
  const iso = isoDate(date);
  const log = store.logs[iso] ?? null;
  const weekdayId = store.routine.week[mondayIndex(date)] ?? null;
  // Si hay log, manda su plantilla (que puede ser null = descanso puntual).
  // Si no, la asignación semanal.
  const templateId = log ? log.templateId : weekdayId;
  const template = templateId
    ? (store.templates.find((t) => t.id === templateId) ?? null)
    : null;
  return { iso, template, log };
}

/** Series marcadas de un ejercicio (sin pasarse de su total). */
export function setsDone(ex: Exercise, log: DayLog | null): number {
  const arr = log?.sets[ex.id];
  if (!arr) return 0;
  let n = 0;
  for (let i = 0; i < ex.sets; i++) if (arr[i]) n++;
  return n;
}

export function exerciseComplete(ex: Exercise, log: DayLog | null): boolean {
  return ex.sets > 0 && setsDone(ex, log) >= ex.sets;
}

export interface DayProgress {
  doneSets: number;
  totalSets: number;
  doneExercises: number;
  totalExercises: number;
  /** Descanso, o plantilla sin ejercicios, o todas las series hechas. */
  complete: boolean;
  /** Hay plantilla con al menos un ejercicio. */
  hasPlan: boolean;
  rest: boolean;
}

export function dayProgress(resolved: ResolvedDay): DayProgress {
  const { template, log } = resolved;
  if (!template) {
    return {
      doneSets: 0,
      totalSets: 0,
      doneExercises: 0,
      totalExercises: 0,
      complete: true,
      hasPlan: false,
      rest: true,
    };
  }
  let doneSets = 0;
  let totalSets = 0;
  let doneExercises = 0;
  for (const ex of template.exercises) {
    totalSets += ex.sets;
    doneSets += setsDone(ex, log);
    if (exerciseComplete(ex, log)) doneExercises++;
  }
  const totalExercises = template.exercises.length;
  return {
    doneSets,
    totalSets,
    doneExercises,
    totalExercises,
    complete: totalExercises === 0 ? true : doneExercises === totalExercises,
    hasPlan: totalExercises > 0,
    rest: false,
  };
}

/**
 * Racha actual: días consecutivos "completos" hacia atrás.
 * Hoy no rompe la racha aunque aún no esté completo.
 */
export function currentStreak(store: Store, today: Date = startOfToday()): number {
  const progAt = (d: Date) => dayProgress(resolveDay(store, d));

  let cursor = progAt(today).complete ? today : addDays(today, -1);
  let streak = 0;
  for (let i = 0; i < 730; i++) {
    const p = progAt(cursor);
    if (!p.complete) break;
    if (p.hasPlan) streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Días con plan y todas las series hechas (sesiones completadas en total). */
export function completedSessions(store: Store): number {
  let count = 0;
  for (const iso of Object.keys(store.logs)) {
    const [y, m, d] = iso.split("-").map(Number);
    const p = dayProgress(resolveDay(store, new Date(y, m - 1, d)));
    if (p.hasPlan && p.complete) count++;
  }
  return count;
}
