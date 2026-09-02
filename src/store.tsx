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

function sanitizeTemplate(raw: unknown): Template | null {
  const o = asObject(raw);
  if (!o) return null;
  const t = str(o.type) as DayType;
  const type: DayType = DAY_TYPES.includes(t) ? t : "gym";
  const kind = exerciseKindForType(type);
  const exercises = Array.isArray(o.exercises)
    ? o.exercises
        .map((e) => sanitizeExercise(e, kind))
        .filter((e): e is Exercise => e !== null)
    : [];
  return { id: str(o.id) || id("t"), name: str(o.name) || "sin nombre", type, exercises };
}

function sanitizeLogs(raw: unknown): Store["logs"] {
  const out: Store["logs"] = {};
  const o = asObject(raw);
  if (!o) return out;
  for (const [dateKey, value] of Object.entries(o)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
    const e = asObject(value);
    if (!e) continue;
    const templateId = str(e.templateId);
    if (!templateId) continue;
    const sets: Record<string, boolean[]> = {};
    const rawSets = asObject(e.sets);
    if (rawSets) {
      for (const [exId, arr] of Object.entries(rawSets)) {
        if (Array.isArray(arr)) sets[exId] = arr.map(Boolean);
      }
    }
    out[dateKey] = { templateId, sets };
  }
  return out;
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
    logs: sanitizeLogs(o.logs),
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

// ------------------------------------------------------------- contexto

interface StoreContextValue {
  store: Store;

  createTemplate: (name: string, type: DayType) => string;
  renameTemplate: (templateId: string, name: string) => void;
  setTemplateType: (templateId: string, type: DayType) => void;
  deleteTemplate: (templateId: string) => void;
  addExercise: (templateId: string) => void;
  updateExercise: (templateId: string, exId: string, patch: ExercisePatch) => void;
  deleteExercise: (templateId: string, exId: string) => void;
  moveExercise: (templateId: string, exId: string, dir: -1 | 1) => void;

  assignTemplate: (weekday: number, templateId: string | null) => void;

  toggleSet: (iso: string, templateId: string, exId: string, setIndex: number) => void;
  resetDay: (iso: string) => void;

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
        exercises: [...t.exercises, newExercise(exerciseKindForType(t.type))],
      })),
    );
  }, []);

  const updateExercise = useCallback(
    (templateId: string, exId: string, patch: ExercisePatch) => {
      setStore((s) =>
        withTemplate(s, templateId, (t) => ({
          ...t,
          exercises: t.exercises.map((e) =>
            e.id === exId ? ({ ...e, ...patch } as Exercise) : e,
          ),
        })),
      );
    },
    [],
  );

  const deleteExercise = useCallback((templateId: string, exId: string) => {
    setStore((s) =>
      withTemplate(s, templateId, (t) => ({
        ...t,
        exercises: t.exercises.filter((e) => e.id !== exId),
      })),
    );
  }, []);

  const moveExercise = useCallback(
    (templateId: string, exId: string, dir: -1 | 1) => {
      setStore((s) =>
        withTemplate(s, templateId, (t) => {
          const i = t.exercises.findIndex((e) => e.id === exId);
          return { ...t, exercises: move(t.exercises, i, dir) };
        }),
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

  const toggleSet = useCallback(
    (iso: string, templateId: string, exId: string, setIndex: number) => {
      setStore((s) => {
        const cur = s.logs[iso];
        const tId = cur?.templateId || templateId;
        const arr = (cur?.sets[exId] ?? []).slice();
        while (arr.length <= setIndex) arr.push(false);
        arr[setIndex] = !arr[setIndex];
        return {
          ...s,
          logs: {
            ...s.logs,
            [iso]: { templateId: tId, sets: { ...(cur?.sets ?? {}), [exId]: arr } },
          },
        };
      });
    },
    [],
  );

  const resetDay = useCallback((iso: string) => {
    setStore((s) => {
      if (!s.logs[iso]) return s;
      const logs = { ...s.logs };
      delete logs[iso];
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
      setTemplateType,
      deleteTemplate,
      addExercise,
      updateExercise,
      deleteExercise,
      moveExercise,
      assignTemplate,
      toggleSet,
      resetDay,
      loadExample,
      exportJson,
      importJson,
      clearAll,
    }),
    [
      store,
      createTemplate,
      renameTemplate,
      setTemplateType,
      deleteTemplate,
      addExercise,
      updateExercise,
      deleteExercise,
      moveExercise,
      assignTemplate,
      toggleSet,
      resetDay,
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
