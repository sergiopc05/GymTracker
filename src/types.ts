// Modelo de datos de GymTracker v2. Todo vive en localStorage; no hay servidor.

export type DayType = "gym" | "running" | "core" | "swim";

export const DAY_TYPES: DayType[] = ["gym", "running", "core", "swim"];

/** Ejercicio de fuerza: gym y core. */
export interface StrengthExercise {
  kind: "strength";
  id: string;
  name: string;
  sets: number;
  /** Repeticiones como texto libre: "8", "8-10", "AMRAP", "30 s". */
  reps: string;
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
  /** Metros. No aplica a "andar". */
  distanceM?: number;
  /** Minutos. "andar" solo usa esto. */
  durationMin?: number;
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
  /** Homogéneo según `type`: strength para gym/core, run para running, swim para swim. */
  exercises: Exercise[];
}

export interface Routine {
  /** Longitud 7, indexado por día (0 = lunes). templateId asignado, o null = descanso. */
  week: (string | null)[];
}

/** Progreso de una fecha concreta del calendario. */
export interface DayLog {
  /** Plantilla que estaba asignada ese día (se guarda por si luego cambia la semana). */
  templateId: string;
  /** exerciseId -> estado de cada serie (índice = nº de serie). */
  sets: Record<string, boolean[]>;
}

export interface Store {
  version: 2;
  templates: Template[];
  routine: Routine;
  /** clave = fecha ISO local "YYYY-MM-DD" */
  logs: Record<string, DayLog>;
}

/** Tipo de ejercicio que corresponde a cada tipo de día. */
export function exerciseKindForType(type: DayType): Exercise["kind"] {
  switch (type) {
    case "running":
      return "run";
    case "swim":
      return "swim";
    default:
      return "strength";
  }
}
