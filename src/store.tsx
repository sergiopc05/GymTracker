import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DayLog, DayPlan, Routine, Store } from "./types";
import { emptyRoutine, exampleRoutine } from "./defaultRoutine";
import { id } from "./lib/id";

const KEY = "gymtracker:v1";

// ------------------------------------------------------------- carga / validacion

function freshStore(): Store {
  return { version: 1, routine: emptyRoutine(), logs: {} };
}

function asObject(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function sanitizeRoutine(raw: unknown): Routine {
  const base = emptyRoutine();
  const obj = asObject(raw);
  const days = obj && Array.isArray(obj.days) ? obj.days : null;
  if (!days) return base;

  for (let w = 0; w < 7; w++) {
    const d = asObject(days[w]);
    if (!d) continue;
    const gym = Array.isArray(d.gym) ? d.gym : [];
    const runs = Array.isArray(d.runs) ? d.runs : [];
    base.days[w] = {
      weekday: w,
      title: typeof d.title === "string" ? d.title : "",
      rest: Boolean(d.rest),
      gym: gym
        .map(asObject)
        .filter(
          (e): e is Record<string, unknown> =>
            !!e && typeof e.id === "string" && typeof e.name === "string",
        )
        .map((e) => ({ id: e.id as string, name: e.name as string })),
      runs: runs
        .map(asObject)
        .filter(
          (e): e is Record<string, unknown> =>
            !!e && typeof e.id === "string" && typeof e.label === "string",
        )
        .map((e) => ({ id: e.id as string, label: e.label as string })),
    };
  }
  return base;
}

function sanitizeLogs(raw: unknown): Record<string, DayLog> {
  const out: Record<string, DayLog> = {};
  const obj = asObject(raw);
  if (!obj) return out;

  for (const [dateKey, value] of Object.entries(obj)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
    const entry = asObject(value);
    if (!entry) continue;
    const gym: Record<string, boolean> = {};
    const runs: Record<string, boolean> = {};
    const rawGym = asObject(entry.gym);
    const rawRuns = asObject(entry.runs);
    if (rawGym) for (const [k, v] of Object.entries(rawGym)) if (v === true) gym[k] = true;
    if (rawRuns) for (const [k, v] of Object.entries(rawRuns)) if (v === true) runs[k] = true;
    out[dateKey] = { gym, runs };
  }
  return out;
}

function sanitizeStore(raw: unknown): Store {
  const obj = asObject(raw);
  return {
    version: 1,
    routine: sanitizeRoutine(obj?.routine),
    logs: sanitizeLogs(obj?.logs),
  };
}

function loadStore(): Store {
  try {
    const txt = localStorage.getItem(KEY);
    if (!txt) return freshStore();
    return sanitizeStore(JSON.parse(txt) as unknown);
  } catch {
    return freshStore();
  }
}

// ------------------------------------------------------------- helpers inmutables

function updateDay(
  store: Store,
  weekday: number,
  fn: (day: DayPlan) => DayPlan,
): Store {
  return {
    ...store,
    routine: {
      days: store.routine.days.map((d, i) => (i === weekday ? fn(d) : d)),
    },
  };
}

function updateLog(store: Store, iso: string, fn: (log: DayLog) => DayLog): Store {
  const current = store.logs[iso] ?? { gym: {}, runs: {} };
  const next = fn({ gym: { ...current.gym }, runs: { ...current.runs } });
  return { ...store, logs: { ...store.logs, [iso]: next } };
}

function move<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const j = index + dir;
  if (index < 0 || j < 0 || j >= arr.length) return arr;
  const copy = arr.slice();
  const tmp = copy[index];
  copy[index] = copy[j];
  copy[j] = tmp;
  return copy;
}

// ------------------------------------------------------------- contexto

interface StoreContextValue {
  store: Store;

  setDayTitle: (weekday: number, title: string) => void;
  setRest: (weekday: number, rest: boolean) => void;
  addExercise: (weekday: number, name: string) => void;
  renameExercise: (weekday: number, exId: string, name: string) => void;
  deleteExercise: (weekday: number, exId: string) => void;
  moveExercise: (weekday: number, exId: string, dir: -1 | 1) => void;
  addRun: (weekday: number, label: string) => void;
  renameRun: (weekday: number, runId: string, label: string) => void;
  deleteRun: (weekday: number, runId: string) => void;
  moveRun: (weekday: number, runId: string, dir: -1 | 1) => void;
  loadExample: () => void;
  clearRoutine: () => void;

  toggleGym: (iso: string, exId: string) => void;
  toggleRun: (iso: string, runId: string) => void;
  resetDay: (iso: string) => void;

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
      // Almacenamiento lleno o bloqueado: la sesión sigue funcionando en memoria.
    }
  }, [store]);

  const setDayTitle = useCallback((weekday: number, title: string) => {
    setStore((s) => updateDay(s, weekday, (d) => ({ ...d, title })));
  }, []);

  const setRest = useCallback((weekday: number, rest: boolean) => {
    setStore((s) => updateDay(s, weekday, (d) => ({ ...d, rest })));
  }, []);

  const addExercise = useCallback((weekday: number, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setStore((s) =>
      updateDay(s, weekday, (d) => ({
        ...d,
        rest: false,
        gym: [...d.gym, { id: id("e"), name: trimmed }],
      })),
    );
  }, []);

  const renameExercise = useCallback(
    (weekday: number, exId: string, name: string) => {
      setStore((s) =>
        updateDay(s, weekday, (d) => ({
          ...d,
          gym: d.gym.map((e) => (e.id === exId ? { ...e, name } : e)),
        })),
      );
    },
    [],
  );

  const deleteExercise = useCallback((weekday: number, exId: string) => {
    setStore((s) =>
      updateDay(s, weekday, (d) => ({
        ...d,
        gym: d.gym.filter((e) => e.id !== exId),
      })),
    );
  }, []);

  const moveExercise = useCallback(
    (weekday: number, exId: string, dir: -1 | 1) => {
      setStore((s) =>
        updateDay(s, weekday, (d) => {
          const i = d.gym.findIndex((e) => e.id === exId);
          return { ...d, gym: move(d.gym, i, dir) };
        }),
      );
    },
    [],
  );

  const addRun = useCallback((weekday: number, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setStore((s) =>
      updateDay(s, weekday, (d) => ({
        ...d,
        rest: false,
        runs: [...d.runs, { id: id("r"), label: trimmed }],
      })),
    );
  }, []);

  const renameRun = useCallback((weekday: number, runId: string, label: string) => {
    setStore((s) =>
      updateDay(s, weekday, (d) => ({
        ...d,
        runs: d.runs.map((r) => (r.id === runId ? { ...r, label } : r)),
      })),
    );
  }, []);

  const deleteRun = useCallback((weekday: number, runId: string) => {
    setStore((s) =>
      updateDay(s, weekday, (d) => ({
        ...d,
        runs: d.runs.filter((r) => r.id !== runId),
      })),
    );
  }, []);

  const moveRun = useCallback((weekday: number, runId: string, dir: -1 | 1) => {
    setStore((s) =>
      updateDay(s, weekday, (d) => {
        const i = d.runs.findIndex((r) => r.id === runId);
        return { ...d, runs: move(d.runs, i, dir) };
      }),
    );
  }, []);

  const loadExample = useCallback(() => {
    setStore((s) => ({ ...s, routine: exampleRoutine() }));
  }, []);

  const clearRoutine = useCallback(() => {
    setStore((s) => ({ ...s, routine: emptyRoutine() }));
  }, []);

  const toggleGym = useCallback((iso: string, exId: string) => {
    setStore((s) =>
      updateLog(s, iso, (log) => {
        if (log.gym[exId]) delete log.gym[exId];
        else log.gym[exId] = true;
        return log;
      }),
    );
  }, []);

  const toggleRun = useCallback((iso: string, runId: string) => {
    setStore((s) =>
      updateLog(s, iso, (log) => {
        if (log.runs[runId]) delete log.runs[runId];
        else log.runs[runId] = true;
        return log;
      }),
    );
  }, []);

  const resetDay = useCallback((iso: string) => {
    setStore((s) => {
      if (!s.logs[iso]) return s;
      const logs = { ...s.logs };
      delete logs[iso];
      return { ...s, logs };
    });
  }, []);

  const exportJson = useCallback(() => JSON.stringify(store, null, 2), [store]);

  const importJson = useCallback(
    (text: string): { ok: true } | { ok: false; error: string } => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { ok: false, error: "El texto no es un JSON válido." };
      }
      const obj = asObject(parsed);
      if (!obj || !("routine" in obj)) {
        return { ok: false, error: "No parece una copia de seguridad de GymTracker." };
      }
      setStore(sanitizeStore(parsed));
      return { ok: true };
    },
    [],
  );

  const clearAll = useCallback(() => setStore(freshStore()), []);

  const value = useMemo<StoreContextValue>(
    () => ({
      store,
      setDayTitle,
      setRest,
      addExercise,
      renameExercise,
      deleteExercise,
      moveExercise,
      addRun,
      renameRun,
      deleteRun,
      moveRun,
      loadExample,
      clearRoutine,
      toggleGym,
      toggleRun,
      resetDay,
      exportJson,
      importJson,
      clearAll,
    }),
    [
      store,
      setDayTitle,
      setRest,
      addExercise,
      renameExercise,
      deleteExercise,
      moveExercise,
      addRun,
      renameRun,
      deleteRun,
      moveRun,
      loadExample,
      clearRoutine,
      toggleGym,
      toggleRun,
      resetDay,
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
