import type {
  DayType,
  RunExercise,
  RunModality,
  Store,
  StrengthExercise,
  SwimExercise,
  Template,
} from "./types";
import { id } from "./lib/id";

/** Store vacío: sin plantillas, los 7 días en descanso. */
export function emptyStore(): Store {
  return {
    version: 2,
    templates: [],
    routine: { week: [null, null, null, null, null, null, null] },
    logs: {},
  };
}

// --- constructores para la rutina de ejemplo ---

function strength(
  name: string,
  sets: number,
  reps: string,
  weightKg?: number,
  restSec?: number,
): StrengthExercise {
  return { kind: "strength", id: id("e"), name, sets, reps, weightKg, restSec };
}

function run(
  modality: RunModality,
  sets: number,
  opts: {
    distanceM?: number;
    durationMin?: number;
    restSec?: number;
    note?: string;
  } = {},
): RunExercise {
  return { kind: "run", id: id("e"), modality, sets, ...opts };
}

function swim(
  name: string,
  sets: number,
  distanceM: number,
  opts: { restSec?: number; durationSec?: number } = {},
): SwimExercise {
  return { kind: "swim", id: id("e"), name, sets, distanceM, ...opts };
}

function tpl(name: string, type: DayType, exercises: Template["exercises"]): Template {
  return { id: id("t"), name, type, exercises };
}

/** Rutina de ejemplo: una plantilla de cada estilo asignada a la semana. */
export function exampleData(): Store {
  const empuje = tpl("Empuje A", "gym", [
    strength("Press banca", 4, "6", 80, 150),
    strength("Press militar mancuernas", 3, "8", 20, 90),
    strength("Fondos en paralelas", 3, "10", undefined, 90),
    strength("Elevaciones laterales", 3, "15", 10, 60),
    strength("Extensión de tríceps en polea", 3, "12", undefined, 60),
  ]);

  const tiron = tpl("Tirón A", "gym", [
    strength("Dominadas", 4, "6", undefined, 150),
    strength("Remo con barra", 4, "8", 60, 120),
    strength("Jalón al pecho", 3, "10", undefined, 90),
    strength("Curl de bíceps", 3, "12", 12, 60),
    strength("Face pull", 3, "15", undefined, 60),
  ]);

  const pierna = tpl("Pierna A", "gym", [
    strength("Sentadilla", 4, "6", 90, 180),
    strength("Peso muerto rumano", 3, "8", 70, 150),
    strength("Prensa", 3, "12", undefined, 90),
    strength("Curl femoral", 3, "12", undefined, 60),
    strength("Gemelo de pie", 4, "15", undefined, 45),
  ]);

  const core = tpl("Core corto", "core", [
    strength("Plancha", 3, "45 s", undefined, 30),
    strength("Hollow hold", 3, "30 s", undefined, 30),
    strength("Rueda abdominal", 3, "10", undefined, 45),
    strength("Elevación de piernas colgado", 3, "12", undefined, 45),
  ]);

  const rodaje = tpl("Rodaje suave", "running", [
    run("trotar", 1, { distanceM: 5000, durationMin: 30 }),
    run("andar", 1, { durationMin: 10, note: "vuelta a la calma" }),
  ]);

  const series = tpl("Series en pista", "running", [
    run("andar", 1, { distanceM: 1500, durationMin: 12, note: "calentamiento" }),
    run("carrera", 6, { distanceM: 400, restSec: 90 }),
    run("andar", 1, { distanceM: 1500, note: "enfriamiento" }),
  ]);

  const piscina = tpl("Piscina técnica", "swim", [
    swim("Calentamiento", 1, 400),
    swim("Técnica de crol", 8, 50, { restSec: 20, durationSec: 60 }),
    swim("Crol continuo", 6, 100, { restSec: 30, durationSec: 110 }),
    swim("Suave a elección", 1, 200),
  ]);

  const templates = [empuje, tiron, pierna, core, rodaje, series, piscina];

  return {
    version: 2,
    templates,
    routine: {
      week: [
        empuje.id, // lunes
        rodaje.id, // martes
        tiron.id, // miércoles
        core.id, // jueves
        pierna.id, // viernes
        series.id, // sábado
        piscina.id, // domingo
      ],
    },
    logs: {},
  };
}
