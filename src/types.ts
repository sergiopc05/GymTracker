// Modelo de datos de GymTracker v2. Todo vive en localStorage; no hay servidor.

import type { Equipment, Muscle } from "./lib/catalogVocab";

export type DayType = "gym" | "running" | "core" | "swim" | "rest";

export const DAY_TYPES: DayType[] = ["gym", "running", "core", "swim", "rest"];

/** Ejercicio de fuerza: gym y core. */
export interface StrengthExercise {
  kind: "strength";
  id: string;
  name: string;
  /** Vínculo con el catálogo (free-exercise-db). Solo enriquece la UI; `name` manda. */
  catalogId?: string;
  /** Vínculo con un ejercicio propio (`Store.customExercises`). Excluyente con `catalogId`. */
  customExerciseId?: string;
  sets: number;
  /** Cómo se cuenta cada serie: por repeticiones (`reps`) o por tiempo (`durationSec`). */
  measure: "reps" | "time";
  /** Repeticiones como texto libre: "8", "8-10", "AMRAP". */
  reps: string;
  /** Segundos por serie cuando `measure === "time"` (plancha, isométricos). */
  durationSec?: number;
  weightKg?: number;
  /** Descanso entre series, en segundos. */
  restSec?: number;
}

export type RunModality = "andar" | "trotar" | "fartlek" | "carrera";

export const RUN_MODALITIES: RunModality[] = ["andar", "trotar", "fartlek", "carrera"];

/** Bloque de running. `sets` = 1 para un esfuerzo continuo; > 1 para intervalos. */
export interface RunExercise {
  kind: "run";
  id: string;
  modality: RunModality;
  sets: number;
  /** Solo "andar": medir por distancia o por tiempo. Ausente = tiempo. */
  measure?: "distance" | "duration";
  /** Metros. */
  distanceM?: number;
  /** Minutos. No se usa en "fartlek". */
  durationMin?: number;
  /** Fartlek: minutos de carrera (parte fuerte) por repetición. */
  effortMin?: number;
  /** Fartlek: minutos de trote (recuperación) por repetición. */
  recoveryMin?: number;
  restSec?: number;
  note?: string;
}

/** Serie de piscina, p.ej. 8 x 100 m. */
export interface SwimExercise {
  kind: "swim";
  id: string;
  name?: string;
  sets: number;
  distanceM: number;
  restSec?: number;
  /** Tiempo objetivo por serie, en segundos. */
  durationSec?: number;
}

export type Exercise = StrengthExercise | RunExercise | SwimExercise;

export interface Template {
  id: string;
  name: string;
  type: DayType;
  /** Emoji opcional para identificar la plantilla de un vistazo. */
  emoji?: string;
  /** Homogéneo según `type`: strength para gym/core, run para running, swim para swim. */
  exercises: Exercise[];
}

export interface Routine {
  /** Longitud 7, indexado por día (0 = lunes). templateId asignado, o null = descanso. */
  week: (string | null)[];
}

/**
 * Copia congelada del plan de un día. Se hace la primera vez que se registra algo
 * o se edita el día a mano, y sobrevive a ediciones y al borrado de la plantilla.
 */
export interface DayPlanSnapshot {
  name: string;
  type: DayType;
  emoji?: string;
  exercises: Exercise[];
}

/** Progreso / ajuste de una fecha concreta del calendario. */
export interface DayLog {
  /**
   * Plantilla de la que salió este día (vínculo para "volver a la plantilla" y
   * comparación con el plan de la semana). Puede diferir de la asignación semanal
   * (cambio puntual). `null` = ese día se marcó como descanso desde la pantalla "hoy".
   */
  templateId: string | null;
  /**
   * Si existe, el día se muestra y se puntúa desde aquí y NO sigue la plantilla en vivo.
   * Invariante: si `templateId === null` no hay snapshot ni `customized`.
   */
  snapshot?: DayPlanSnapshot;
  /** El usuario editó a mano los ejercicios de este día (el snapshot ya no es la plantilla). */
  customized?: boolean;
  /** exerciseId -> estado de cada serie (índice = nº de serie). */
  sets: Record<string, boolean[]>;
  /**
   * Día marcado como hecho a mano. Solo se usa cuando el plan no tiene
   * ejercicios que marcar; con ejercicios, el día se completa al marcarlos todos.
   */
  done?: boolean;
}

/** Ejercicio creado por el usuario. Vive en el store (entra en la copia de seguridad). */
export interface CustomExercise {
  id: string;
  nameEs: string;
  primaryMuscles: Muscle[];
  equipment: Equipment | null;
  /** Pasos, uno por línea. */
  instructions?: string[];
  /** dataURL (image/webp o image/jpeg), redimensionada a ~320 px, <= ~25 KB. */
  photo?: string;
  createdAt: number;
}

export interface Store {
  version: 2;
  templates: Template[];
  routine: Routine;
  /** clave = fecha ISO local "YYYY-MM-DD" */
  logs: Record<string, DayLog>;
  /** Ejercicios propios del usuario, reutilizables en plantillas y días. */
  customExercises: CustomExercise[];
}

/** Tipo de ejercicio que corresponde a cada tipo de día. */
export function exerciseKindForType(type: DayType): Exercise["kind"] {
  switch (type) {
    case "running":
    case "rest": // descanso activo: caminar / trotar suave
      return "run";
    case "swim":
      return "swim";
    default:
      return "strength";
  }
}
