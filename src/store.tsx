import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  DayLog,
  DayPlanSnapshot,
  DayType,
  Exercise,
  RunExercise,
  StrengthExercise,
  SwimExercise,
  Store,
  Template,
} from "./types";
import { DAY_TYPES, RUN_MODALITIES, exerciseKindForType } from "./types";
import { emptyStore, exampleData } from "./defaultData";
import { id } from "./lib/id";
import { mondayIndex, parseIso } from "./lib/dates";
import { resolveDay } from "./lib/progress";

const KEY = "gymtracker:v2";

// ------------------------------------------------------------- helpers de validación

function asObject(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function numOrU(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function clampInt(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
}

function sanitizeExercise(raw: unknown, kind: Exercise["kind"]): Exercise | null {
  const o = asObject(raw);
  if (!o) return null;
  const exId = str(o.id) || id("e");
  const sets = clampInt(o.sets, 1, 1, 99);

  if (kind === "strength") {
    return {
      kind: "strength",
      id: exId,
      name: str(o.name),
      sets,
      reps: str(o.reps) || "10",
      weightKg: numOrU(o.weightKg),
      restSec: numOrU(o.restSec),
    };
  }
  if (kind === "run") {
    const m = str(o.modality) as RunExercise["modality"];
    return {
      kind: "run",
      id: exId,
      modality: RUN_MODALITIES.includes(m) ? m : "trotar",
      sets,
      distanceM: numOrU(o.distanceM),
      durationMin: numOrU(o.durationMin),
      effortMin: numOrU(o.effortMin),
      recoveryMin: numOrU(o.recoveryMin),
      restSec: numOrU(o.restSec),
      note: o.note ? str(o.note) : undefined,
    };
  }
  return {
    kind: "swim",
    id: exId,
    name: o.name ? str(o.name) : undefined,
    sets,
    distanceM: numOrU(o.distanceM) ?? 100,
    restSec: numOrU(o.restSec),
    durationSec: numOrU(o.durationSec),
  };
}

function sanitizeDayType(v: unknown): DayType | null {
  const t = str(v) as DayType;
  return DAY_TYPES.includes(t) ? t : null;
}

function sanitizeExerciseArray(raw: unknown, kind: Exercise["kind"]): Exercise[] {
  return Array.isArray(raw)
    ? raw
        .map((e) => sanitizeExercise(e, kind))
        .filter((e): e is Exercise => e !== null)
    : [];
}

function sanitizeEmoji(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.slice(0, 8) : undefined;
}

function sanitizeTemplate(raw: unknown): Template | null {
  const o = asObject(raw);
  if (!o) return null;
  const type = sanitizeDayType(o.type) ?? "gym";
  return {
    id: str(o.id) || id("t"),
    name: str(o.name) || "sin nombre",
    type,
    emoji: sanitizeEmoji(o.emoji),
    exercises: sanitizeExerciseArray(o.exercises, exerciseKindForType(type)),
  };
}

function sanitizeSnapshot(raw: unknown): DayPlanSnapshot | undefined {
  const o = asObject(raw);
  if (!o) return undefined;
  const type = sanitizeDayType(o.type);
  if (!type) return undefined;
  return {
    name: str(o.name) || "sin nombre",
    type,
    emoji: sanitizeEmoji(o.emoji),
    exercises: sanitizeExerciseArray(o.exercises, exerciseKindForType(type)),
  };
}

function sanitizeLogs(raw: unknown): Store["logs"] {
  const out: Store["logs"] = {};
  const o = asObject(raw);
  if (!o) return out;
  for (const [dateKey, value] of Object.entries(o)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
    const e = asObject(value);
    if (!e) continue;
    const hasTid = typeof e.templateId === "string" && e.templateId.length > 0;
    const explicitRest = e.templateId === null; // día cancelado a mano
    if (!hasTid && !explicitRest) continue;
    const templateId = hasTid ? (e.templateId as string) : null;
    const sets: Record<string, boolean[]> = {};
    const rawSets = asObject(e.sets);
    if (rawSets) {
      for (const [exId, arr] of Object.entries(rawSets)) {
        if (Array.isArray(arr)) sets[exId] = arr.map(Boolean);
      }
    }
    // Invariante: descanso puntual (templateId null) nunca lleva snapshot ni customized.
    const snapshot = templateId ? sanitizeSnapshot(e.snapshot) : undefined;
    out[dateKey] = {
      templateId,
      snapshot,
      customized: snapshot && e.customized === true ? true : undefined,
      sets,
      done: e.done === true ? true : undefined,
    };
  }
  return out;
}

function hasProgress(log: DayLog): boolean {
  return log.done === true || Object.values(log.sets).some((a) => a.some(Boolean));
}

function snapshotFromTemplate(t: Template): DayPlanSnapshot {
  return {
    name: t.name,
    type: t.type,
    emoji: t.emoji,
    exercises: t.exercises.map((e) => ({ ...e })),
  };
}

/**
 * Congela los días ya entrenados (con progreso) que aún siguen la plantilla en vivo,
 * para que futuras ediciones de la plantilla no los alteren. Idempotente.
 */
function migrateLogs(templates: Template[], logs: Store["logs"]): Store["logs"] {
  const byId = new Map(templates.map((t) => [t.id, t]));
  let out: Store["logs"] | null = null;
  for (const [iso, log] of Object.entries(logs)) {
    if (log.snapshot || !log.templateId || !hasProgress(log)) continue;
    const t = byId.get(log.templateId);
    if (!t) continue;
    (out ??= { ...logs })[iso] = { ...log, snapshot: snapshotFromTemplate(t) };
  }
  return out ?? logs;
}

function sanitizeStore(raw: unknown): Store {
  const o = asObject(raw);
  if (!o || o.version !== 2) return emptyStore();

  const templates = Array.isArray(o.templates)
    ? o.templates
        .map(sanitizeTemplate)
        .filter((t): t is Template => t !== null)
    : [];
  const ids = new Set(templates.map((t) => t.id));

  const rawWeek = asObject(o.routine)?.week;
  const week = Array.from({ length: 7 }, (_, i) => {
    const v = Array.isArray(rawWeek) ? rawWeek[i] : null;
    return typeof v === "string" && ids.has(v) ? v : null;
  });

  return {
    version: 2,
    templates,
    routine: { week },
    logs: migrateLogs(templates, sanitizeLogs(o.logs)),
  };
}

function loadStore(): Store {
  try {
    const txt = localStorage.getItem(KEY);
    if (!txt) return emptyStore();
    return sanitizeStore(JSON.parse(txt) as unknown);
  } catch {
    return emptyStore();
  }
}

// ------------------------------------------------------------- helpers inmutables

function move<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const j = index + dir;
  if (index < 0 || j < 0 || j >= arr.length) return arr;
  const copy = arr.slice();
  const tmp = copy[index];
  copy[index] = copy[j];
  copy[j] = tmp;
  return copy;
}

function withTemplate(
  store: Store,
  templateId: string,
  fn: (t: Template) => Template,
): Store {
  return {
    ...store,
    templates: store.templates.map((t) => (t.id === templateId ? fn(t) : t)),
  };
}

function newExercise(kind: Exercise["kind"]): Exercise {
  if (kind === "run") return { kind: "run", id: id("e"), modality: "trotar", sets: 1 };
  if (kind === "swim")
    return { kind: "swim", id: id("e"), name: "", sets: 1, distanceM: 100 };
  return { kind: "strength", id: id("e"), name: "", sets: 3, reps: "10" };
}

export type ExercisePatch = Partial<Omit<StrengthExercise, "kind" | "id">> &
  Partial<Omit<RunExercise, "kind" | "id">> &
  Partial<Omit<SwimExercise, "kind" | "id">>;

/** Transformaciones puras sobre una lista de ejercicios (plantilla o día). */
const exArray = {
  add: (exs: Exercise[], kind: Exercise["kind"]): Exercise[] => [...exs, newExercise(kind)],
  patch: (exs: Exercise[], exId: string, patch: ExercisePatch): Exercise[] =>
    exs.map((e) => (e.id === exId ? ({ ...e, ...patch } as Exercise) : e)),
  remove: (exs: Exercise[], exId: string): Exercise[] => exs.filter((e) => e.id !== exId),
  move: (exs: Exercise[], exId: string, dir: -1 | 1): Exercise[] =>
    move(exs, exs.findIndex((e) => e.id === exId), dir),
};

/** Plantilla enlazada a una fecha: la del log si existe, si no la de la semana. */
function linkedTemplate(store: Store, iso: string): Template | null {
  const log = store.logs[iso] ?? null;
  const tid = log ? log.templateId : (store.routine.week[mondayIndex(parseIso(iso))] ?? null);
  return tid ? (store.templates.find((t) => t.id === tid) ?? null) : null;
}

/**
 * Garantiza que `logs[iso]` existe y tiene `snapshot` (copiado de la plantilla en vivo).
 * No-op si ya está congelado o si no hay plantilla de la que copiar (descanso / borrada).
 */
function ensureFrozenDay(store: Store, iso: string): Store {
  const log = store.logs[iso] ?? null;
  if (log?.snapshot) return store;
  const t = linkedTemplate(store, iso);
  if (!t) return store;
  const frozen: DayLog = {
    templateId: t.id,
    snapshot: snapshotFromTemplate(t),
    sets: log?.sets ?? {},
    done: log?.done,
  };
  return { ...store, logs: { ...store.logs, [iso]: frozen } };
}

/** Congela el día si hace falta y transforma sus ejercicios; lo marca `customized`. */
function withDayExercises(
  store: Store,
  iso: string,
  fn: (exs: Exercise[], type: DayType) => Exercise[],
): Store {
  const s = ensureFrozenDay(store, iso);
  const log = s.logs[iso];
  if (!log?.snapshot) return store;
  const exercises = fn(log.snapshot.exercises, log.snapshot.type);
  return {
    ...s,
    logs: {
      ...s.logs,
      [iso]: { ...log, snapshot: { ...log.snapshot, exercises }, customized: true },
    },
  };
}

// ------------------------------------------------------------- contexto

interface StoreContextValue {
  store: Store;

  createTemplate: (name: string, type: DayType) => string;
  renameTemplate: (templateId: string, name: string) => void;
  setTemplateEmoji: (templateId: string, emoji: string) => void;
  setTemplateType: (templateId: string, type: DayType) => void;
  deleteTemplate: (templateId: string) => void;
  addExercise: (templateId: string) => void;
  updateExercise: (templateId: string, exId: string, patch: ExercisePatch) => void;
  deleteExercise: (templateId: string, exId: string) => void;
  moveExercise: (templateId: string, exId: string, dir: -1 | 1) => void;

  assignTemplate: (weekday: number, templateId: string | null) => void;

  toggleSet: (iso: string, exId: string, setIndex: number) => void;
  setDayDone: (iso: string, done: boolean) => void;
  overrideDay: (iso: string, templateId: string | null) => void;
  resetDay: (iso: string) => void;
  clearSets: (iso: string) => void;

  // Editar los ejercicios de un solo día, sin tocar la plantilla.
  addDayExercise: (iso: string) => void;
  updateDayExercise: (iso: string, exId: string, patch: ExercisePatch) => void;
  deleteDayExercise: (iso: string, exId: string) => void;
  moveDayExercise: (iso: string, exId: string, dir: -1 | 1) => void;
  resyncDayPlan: (iso: string) => void;

  loadExample: () => void;
  exportJson: () => string;
  importJson: (text: string) => { ok: true } | { ok: false; error: string };
  clearAll: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(loadStore);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch {
      // Almacenamiento lleno o bloqueado: la sesión sigue en memoria.
    }
  }, [store]);

  const createTemplate = useCallback((name: string, type: DayType) => {
    const tId = id("t");
    setStore((s) => ({
      ...s,
      templates: [
        ...s.templates,
        { id: tId, name: name.trim() || "sin nombre", type, exercises: [] },
      ],
    }));
    return tId;
  }, []);

  const renameTemplate = useCallback((templateId: string, name: string) => {
    setStore((s) => withTemplate(s, templateId, (t) => ({ ...t, name })));
  }, []);

  const setTemplateEmoji = useCallback((templateId: string, emoji: string) => {
    const clean = emoji.trim().slice(0, 8) || undefined;
    setStore((s) => withTemplate(s, templateId, (t) => ({ ...t, emoji: clean })));
  }, []);

  const setTemplateType = useCallback((templateId: string, type: DayType) => {
    setStore((s) =>
      withTemplate(s, templateId, (t) => {
        if (t.type === type) return t;
        const keep = exerciseKindForType(t.type) === exerciseKindForType(type);
        return { ...t, type, exercises: keep ? t.exercises : [] };
      }),
    );
  }, []);

  const deleteTemplate = useCallback((templateId: string) => {
    setStore((s) => ({
      ...s,
      templates: s.templates.filter((t) => t.id !== templateId),
      routine: { week: s.routine.week.map((w) => (w === templateId ? null : w)) },
    }));
  }, []);

  const addExercise = useCallback((templateId: string) => {
    setStore((s) =>
      withTemplate(s, templateId, (t) => ({
        ...t,
        exercises: exArray.add(t.exercises, exerciseKindForType(t.type)),
      })),
    );
  }, []);

  const updateExercise = useCallback(
    (templateId: string, exId: string, patch: ExercisePatch) => {
      setStore((s) =>
        withTemplate(s, templateId, (t) => ({
          ...t,
          exercises: exArray.patch(t.exercises, exId, patch),
        })),
      );
    },
    [],
  );

  const deleteExercise = useCallback((templateId: string, exId: string) => {
    setStore((s) =>
      withTemplate(s, templateId, (t) => ({
        ...t,
        exercises: exArray.remove(t.exercises, exId),
      })),
    );
  }, []);

  const moveExercise = useCallback(
    (templateId: string, exId: string, dir: -1 | 1) => {
      setStore((s) =>
        withTemplate(s, templateId, (t) => ({
          ...t,
          exercises: exArray.move(t.exercises, exId, dir),
        })),
      );
    },
    [],
  );

  const assignTemplate = useCallback(
    (weekday: number, templateId: string | null) => {
      setStore((s) => {
        const week = s.routine.week.slice();
        week[weekday] = templateId;
        return { ...s, routine: { week } };
      });
    },
    [],
  );

  const toggleSet = useCallback((iso: string, exId: string, setIndex: number) => {
    setStore((s) => {
      if (!resolveDay(s, parseIso(iso)).plan) return s; // descanso: nada que marcar
      const s2 = ensureFrozenDay(s, iso); // el día queda fijado al tocarlo
      const cur = s2.logs[iso];
      const arr = (cur.sets[exId] ?? []).slice();
      while (arr.length <= setIndex) arr.push(false);
      arr[setIndex] = !arr[setIndex];
      return {
        ...s2,
        logs: { ...s2.logs, [iso]: { ...cur, sets: { ...cur.sets, [exId]: arr } } },
      };
    });
  }, []);

  /**
   * Marca (o desmarca) un día como hecho a mano. Se usa cuando el plan no tiene
   * ejercicios que marcar. Al marcar, el día queda fijado.
   */
  const setDayDone = useCallback((iso: string, done: boolean) => {
    setStore((s) => {
      if (done) {
        const s2 = ensureFrozenDay(s, iso);
        const cur = s2.logs[iso] ?? {
          templateId: linkedTemplate(s, iso)?.id ?? null,
          sets: {},
        };
        return { ...s2, logs: { ...s2.logs, [iso]: { ...cur, done: true } } };
      }
      const cur = s.logs[iso];
      if (!cur) return s;
      const logs = { ...s.logs };
      const hasSets = Object.values(cur.sets).some((arr) => arr.some(Boolean));
      const weekdayId = s.routine.week[mondayIndex(parseIso(iso))] ?? null;
      const isOverride = cur.templateId !== weekdayId;
      // Sin nada más que guardar, sin cambio puntual y sin ejercicios propios: borrar el log.
      if (hasSets || isOverride || cur.customized) logs[iso] = { ...cur, done: undefined };
      else delete logs[iso];
      return { ...s, logs };
    });
  }, []);

  /**
   * Cambia (o cancela con null) el entreno de una fecha concreta, sin tocar la semana.
   * Descarta lo registrado y el snapshot: es un plan nuevo para ese día.
   */
  const overrideDay = useCallback((iso: string, templateId: string | null) => {
    setStore((s) => ({
      ...s,
      logs: { ...s.logs, [iso]: { templateId, sets: {} } },
    }));
  }, []);

  /** Deja el día como el plan de la semana, sin nada marcado (borra el log). */
  const resetDay = useCallback((iso: string) => {
    setStore((s) => {
      if (!s.logs[iso]) return s;
      const logs = { ...s.logs };
      delete logs[iso];
      return { ...s, logs };
    });
  }, []);

  /** Desmarca todas las series pero conserva el entreno (snapshot y cambio puntual incluidos). */
  const clearSets = useCallback((iso: string) => {
    setStore((s) => {
      const cur = s.logs[iso];
      if (!cur) return s;
      return { ...s, logs: { ...s.logs, [iso]: { ...cur, sets: {} } } };
    });
  }, []);

  // --- ejercicios de un solo día (no tocan la plantilla) ---

  const addDayExercise = useCallback((iso: string) => {
    setStore((s) =>
      withDayExercises(s, iso, (exs, type) => exArray.add(exs, exerciseKindForType(type))),
    );
  }, []);

  const updateDayExercise = useCallback(
    (iso: string, exId: string, patch: ExercisePatch) => {
      setStore((s) => withDayExercises(s, iso, (exs) => exArray.patch(exs, exId, patch)));
    },
    [],
  );

  const deleteDayExercise = useCallback((iso: string, exId: string) => {
    setStore((s) => withDayExercises(s, iso, (exs) => exArray.remove(exs, exId)));
  }, []);

  const moveDayExercise = useCallback((iso: string, exId: string, dir: -1 | 1) => {
    setStore((s) => withDayExercises(s, iso, (exs) => exArray.move(exs, exId, dir)));
  }, []);

  /** Descarta los ejercicios propios del día y vuelve a seguir la plantilla en vivo. */
  const resyncDayPlan = useCallback((iso: string) => {
    setStore((s) => {
      const cur = s.logs[iso];
      if (!cur?.snapshot) return s;
      const t = cur.templateId
        ? (s.templates.find((x) => x.id === cur.templateId) ?? null)
        : null;
      if (!t) return s; // plantilla borrada: se conserva el registro congelado
      const liveIds = new Set(t.exercises.map((e) => e.id));
      const sets: Record<string, boolean[]> = {};
      for (const [k, v] of Object.entries(cur.sets)) if (liveIds.has(k)) sets[k] = v;
      const weeklyId = s.routine.week[mondayIndex(parseIso(iso))] ?? null;
      const empty =
        cur.done !== true && !Object.values(sets).some((a) => a.some(Boolean));
      const logs = { ...s.logs };
      if (empty && cur.templateId === weeklyId) delete logs[iso];
      else logs[iso] = { templateId: cur.templateId, sets, done: cur.done };
      return { ...s, logs };
    });
  }, []);

  const loadExample = useCallback(() => setStore(exampleData()), []);

  const exportJson = useCallback(() => JSON.stringify(store, null, 2), [store]);

  const importJson = useCallback(
    (text: string): { ok: true } | { ok: false; error: string } => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { ok: false, error: "El texto no es un JSON válido." };
      }
      const o = asObject(parsed);
      if (!o || o.version !== 2) {
        return { ok: false, error: "No parece una copia de seguridad de GymTracker v2." };
      }
      setStore(sanitizeStore(parsed));
      return { ok: true };
    },
    [],
  );

  const clearAll = useCallback(() => setStore(emptyStore()), []);

  const value = useMemo<StoreContextValue>(
    () => ({
      store,
      createTemplate,
      renameTemplate,
      setTemplateEmoji,
      setTemplateType,
      deleteTemplate,
      addExercise,
      updateExercise,
      deleteExercise,
      moveExercise,
      assignTemplate,
      toggleSet,
      setDayDone,
      overrideDay,
      resetDay,
      clearSets,
      addDayExercise,
      updateDayExercise,
      deleteDayExercise,
      moveDayExercise,
      resyncDayPlan,
      loadExample,
      exportJson,
      importJson,
      clearAll,
    }),
    [
      store,
      createTemplate,
      renameTemplate,
      setTemplateEmoji,
      setTemplateType,
      deleteTemplate,
      addExercise,
      updateExercise,
      deleteExercise,
      moveExercise,
      assignTemplate,
      toggleSet,
      setDayDone,
      overrideDay,
      resetDay,
      clearSets,
      addDayExercise,
      updateDayExercise,
      deleteDayExercise,
      moveDayExercise,
      resyncDayPlan,
      loadExample,
      exportJson,
      importJson,
      clearAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}
