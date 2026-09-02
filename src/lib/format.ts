// Formateo de fichas de ejercicio y unidades, con estética compacta de terminal.

import type { DayType, Exercise, RunModality } from "../types";

/** Nombre con su emoji delante, si tiene. Vale para plantillas y para planes de día. */
export function tplLabel(t: { name: string; emoji?: string }): string {
  return t.emoji ? `${t.emoji} ${t.name}` : t.name;
}

export const DAY_TYPE_LABEL: Record<DayType, string> = {
  gym: "gym",
  running: "running",
  core: "core",
  swim: "natación",
  rest: "descanso",
};

/** Glifo corto por tipo de día, para marcar visualmente los bloques. */
export const DAY_TYPE_GLYPH: Record<DayType, string> = {
  gym: "#",
  running: "»",
  core: "*",
  swim: "~",
  rest: "-",
};

export const RUN_MODALITY_LABEL: Record<RunModality, string> = {
  andar: "andar",
  trotar: "trotar",
  fartlek: "fartlek",
  carrera: "carrera",
};

/** Distancia en metros -> "800 m" o "5 km". */
export function fmtDistance(m: number): string {
  if (m >= 1000) {
    const km = m / 1000;
    return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
  }
  return `${m} m`;
}

/** Minutos -> "40'". */
export function fmtMinutes(min: number): string {
  return `${min}'`;
}

/** Segundos -> "45\"", "1'30\"". */
export function fmtSeconds(sec: number): string {
  if (sec < 60) return `${sec}"`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}'` : `${m}'${s}"`;
}

/** Descanso -> "r90\"" o "r2'". */
export function fmtRest(sec: number): string {
  return `r${fmtSeconds(sec)}`;
}

/** Ficha de una línea para un ejercicio, según su tipo. */
export function fmtExerciseSpec(ex: Exercise): string {
  const parts: string[] = [];

  if (ex.kind === "strength") {
    const per =
      ex.measure === "time"
        ? ex.durationSec != null
          ? fmtSeconds(ex.durationSec)
          : "?"
        : ex.reps || "?";
    parts.push(`${ex.sets}×${per}`);
    if (ex.weightKg != null) parts.push(`${ex.weightKg} kg`);
    if (ex.restSec != null) parts.push(fmtRest(ex.restSec));
    return parts.join(" · ");
  }

  if (ex.kind === "run") {
    parts.push(RUN_MODALITY_LABEL[ex.modality]);

    if (ex.modality === "fartlek") {
      const effort = ex.effortMin != null ? fmtMinutes(ex.effortMin) : "?";
      const recovery = ex.recoveryMin != null ? fmtMinutes(ex.recoveryMin) : "?";
      parts.push(`${ex.sets}× (${effort} carrera / ${recovery} trote)`);
      if (ex.note) parts.push(ex.note);
      return parts.join(" · ");
    }

    // "andar" muestra solo la medida elegida; el resto muestra lo que tenga.
    const walkBy = ex.measure ?? "duration";
    const showDist = ex.modality !== "andar" || walkBy === "distance";
    const showDur = ex.modality !== "andar" || walkBy === "duration";
    const chunk: string[] = [];
    if (showDist && ex.distanceM != null) chunk.push(fmtDistance(ex.distanceM));
    if (showDur && ex.durationMin != null) chunk.push(fmtMinutes(ex.durationMin));
    const body = chunk.join(" ") || "—";
    parts.push(ex.sets > 1 ? `${ex.sets}× ${body}` : body);
    if (ex.sets > 1 && ex.restSec != null) parts.push(fmtRest(ex.restSec));
    if (ex.note) parts.push(ex.note);
    return parts.join(" · ");
  }

  // swim
  parts.push(`${ex.sets}×${fmtDistance(ex.distanceM)}`);
  if (ex.durationSec != null) parts.push(fmtSeconds(ex.durationSec));
  if (ex.restSec != null) parts.push(fmtRest(ex.restSec));
  return parts.join(" · ");
}

/** Título mostrado para un ejercicio (running no tiene "nombre" propio). */
export function fmtExerciseName(ex: Exercise): string {
  if (ex.kind === "strength") return ex.name || "(sin nombre)";
  if (ex.kind === "run") return RUN_MODALITY_LABEL[ex.modality];
  return ex.name || "nado";
}

/** "5 ej" / "1 ej" / "vacía". */
export function fmtExerciseCount(n: number): string {
  if (n === 0) return "vacía";
  return `${n} ej`;
}
