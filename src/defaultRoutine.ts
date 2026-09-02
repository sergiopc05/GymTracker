import type { Routine } from "./types";
import { id } from "./lib/id";

/** Rutina vacía: 7 días de descanso, lista para que la edites. */
export function emptyRoutine(): Routine {
  return {
    days: Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      title: "",
      rest: true,
      gym: [],
      runs: [],
    })),
  };
}

/** Rutina de ejemplo (botón "Cargar ejemplo" en Editar). */
export function exampleRoutine(): Routine {
  const gym = (...names: string[]) => names.map((name) => ({ id: id("e"), name }));
  const runs = (...labels: string[]) => labels.map((label) => ({ id: id("r"), label }));

  const r = emptyRoutine();

  // Lunes — Empuje
  r.days[0] = {
    weekday: 0,
    title: "Empuje",
    rest: false,
    gym: gym(
      "Press banca",
      "Press militar con mancuernas",
      "Fondos en paralelas",
      "Elevaciones laterales",
      "Extensión de tríceps en polea",
    ),
    runs: [],
  };

  // Martes — Rodaje suave
  r.days[1] = {
    weekday: 1,
    title: "Rodaje suave",
    rest: false,
    gym: [],
    runs: runs("5 km a ritmo cómodo", "Movilidad 10 min"),
  };

  // Miércoles — Tirón
  r.days[2] = {
    weekday: 2,
    title: "Tirón",
    rest: false,
    gym: gym(
      "Dominadas",
      "Remo con barra",
      "Jalón al pecho",
      "Curl de bíceps",
      "Face pull",
    ),
    runs: [],
  };

  // Jueves — Descanso
  r.days[3] = { weekday: 3, title: "Descanso", rest: true, gym: [], runs: [] };

  // Viernes — Pierna
  r.days[4] = {
    weekday: 4,
    title: "Pierna",
    rest: false,
    gym: gym(
      "Sentadilla",
      "Peso muerto rumano",
      "Prensa",
      "Curl femoral",
      "Gemelo de pie",
    ),
    runs: [],
  };

  // Sábado — Series
  r.days[5] = {
    weekday: 5,
    title: "Series",
    rest: false,
    gym: [],
    runs: runs("Calentamiento 2 km", "6 x 800 m", "Vuelta a la calma 2 km"),
  };

  // Domingo — Tirada larga
  r.days[6] = {
    weekday: 6,
    title: "Tirada larga",
    rest: false,
    gym: [],
    runs: runs("12-15 km a ritmo suave"),
  };

  return r;
}
