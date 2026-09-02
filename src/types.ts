// Modelo de datos de GymTracker. Todo vive en localStorage; no hay servidor.

export interface ExerciseTemplate {
  id: string;
  name: string;
}

export interface RunTemplate {
  id: string;
  /** Etiqueta libre, p.ej. "5 km suave" o "Series 6x400". */
  label: string;
}

export interface DayPlan {
  /** 0 = lunes ... 6 = domingo */
  weekday: number;
  /** Nombre del entreno del dia, p.ej. "Empuje", "Rodaje". Puede estar vacio. */
  title: string;
  /** Dia de descanso: no se planifica nada. */
  rest: boolean;
  gym: ExerciseTemplate[];
  runs: RunTemplate[];
}

export interface Routine {
  /** Siempre longitud 7, indexado por weekday (0 = lunes). */
  days: DayPlan[];
}

/** Progreso de una fecha concreta del calendario. */
export interface DayLog {
  /** exerciseId -> hecho */
  gym: Record<string, boolean>;
  /** runId -> hecho */
  runs: Record<string, boolean>;
}

export interface Store {
  version: 1;
  routine: Routine;
  /** clave = fecha ISO local "YYYY-MM-DD" */
  logs: Record<string, DayLog>;
}
