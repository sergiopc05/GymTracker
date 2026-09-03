// Cálculo de progreso y racha a partir de plantillas + asignación semanal + logs.

import type { DayLog, DayType, Exercise, Store, Template } from "../types";
import { addDays, isoDate, mondayIndex, startOfToday, startOfWeek } from "./dates";

/**
 * templateId de la rutina semanal que rige un día concreto, o `null`.
 *
 * La rutina solo aplica desde el lunes de la semana en curso en adelante. Los días
 * de semanas anteriores que no tengan registro propio quedan en descanso: establecer
 * o cambiar la rutina no "rellena" hacia atrás el calendario.
 */
export function routineTemplateIdOn(store: Store, date: Date): string | null {
  if (isoDate(date) < isoDate(startOfWeek(startOfToday()))) return null;
  return store.routine.week[mondayIndex(date)] ?? null;
}

/** Plan efectivo de un día: el snapshot congelado o la plantilla en vivo. */
export interface ResolvedPlan {
  name: string;
  type: DayType;
  emoji?: string;
  /** Referencia al snapshot o a la plantilla — nunca se copia aquí. */
  exercises: Exercise[];
  /** Viene de un snapshot del día (inmune a cambios de la plantilla). */
  frozen: boolean;
  /** El usuario editó los ejercicios de este día. */
  customized: boolean;
}

export interface ResolvedDay {
  iso: string;
  /** Log guardado para esa fecha, si existe. */
  log: DayLog | null;
  /** Plantilla viva enlazada (vínculo, plan de la semana, "¿borrada?"). null = descanso. */
  template: Template | null;
  /** Qué mostrar y puntuar ese día. null = descanso. */
  plan: ResolvedPlan | null;
}

export function resolveDay(store: Store, date: Date): ResolvedDay {
  const iso = isoDate(date);
  const log = store.logs[iso] ?? null;
  const weekdayId = routineTemplateIdOn(store, date);
  // Si hay log, manda su plantilla (que puede ser null = descanso puntual).
  // Si no, la asignación semanal.
  const templateId = log ? log.templateId : weekdayId;
  const template = templateId
    ? (store.templates.find((t) => t.id === templateId) ?? null)
    : null;

  let plan: ResolvedPlan | null = null;
  if (log?.snapshot) {
    plan = {
      name: log.snapshot.name,
      type: log.snapshot.type,
      emoji: log.snapshot.emoji,
      exercises: log.snapshot.exercises,
      frozen: true,
      customized: log.customized === true,
    };
  } else if (template) {
    plan = {
      name: template.name,
      type: template.type,
      emoji: template.emoji,
      exercises: template.exercises,
      frozen: false,
      customized: false,
    };
  }

  return { iso, log, template, plan };
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
  /** Descanso, o día marcado a mano, o todas las series hechas. */
  complete: boolean;
  /** Hay un plan que completar (no es descanso). */
  hasPlan: boolean;
  rest: boolean;
  /** El plan no tiene ejercicios: se completa marcando el día a mano. */
  manual: boolean;
}

export function dayProgress(resolved: ResolvedDay): DayProgress {
  const { plan, log } = resolved;
  const rest = !plan || plan.type === "rest";

  let doneSets = 0;
  let totalSets = 0;
  let doneExercises = 0;
  if (plan) {
    for (const ex of plan.exercises) {
      totalSets += ex.sets;
      doneSets += setsDone(ex, log);
      if (exerciseComplete(ex, log)) doneExercises++;
    }
  }
  const totalExercises = plan?.exercises.length ?? 0;
  // Plan sin ejercicios que marcar: el día se completa a mano, no por defecto.
  const manual = !rest && totalExercises === 0;
  const allDone = manual
    ? log?.done === true
    : totalExercises > 0 && doneExercises === totalExercises;

  return {
    doneSets,
    totalSets,
    doneExercises,
    totalExercises,
    // Un día de descanso siempre está "cubierto"; los ejercicios (p.ej. caminar)
    // son opcionales y no cuentan para la racha.
    complete: rest ? true : allDone,
    hasPlan: !rest,
    rest,
    manual,
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
