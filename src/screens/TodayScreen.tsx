import { Suspense, lazy, useEffect, useState } from "react";
import { useStore } from "../store";
import { SetBoxes } from "../components/SetBoxes";
import { AsciiBar } from "../components/AsciiBar";
import { ExerciseEditor } from "../components/ExerciseEditor";
import type { TabKey } from "../components/TabBar";
import { DAY_TYPES, exerciseKindForType } from "../types";

const CatalogPicker = lazy(() => import("../components/CatalogPicker"));
import {
  WEEKDAY_LONG,
  addDays,
  formatLongDate,
  isoDate,
  mondayIndex,
  startOfToday,
} from "../lib/dates";
import { currentStreak, dayProgress, resolveDay } from "../lib/progress";
import {
  DAY_TYPE_GLYPH,
  DAY_TYPE_LABEL,
  fmtExerciseName,
  fmtExerciseSpec,
  tplLabel,
} from "../lib/format";

interface Props {
  date: Date;
  setDate: (updater: Date | ((d: Date) => Date)) => void;
  goTo: (tab: TabKey) => void;
}

export function TodayScreen({ date, setDate, goTo }: Props) {
  const {
    store,
    toggleSet,
    setDayDone,
    overrideDay,
    resetDay,
    clearSets,
    addDayExercise,
    addDayLinkedExercise,
    updateDayExercise,
    deleteDayExercise,
    moveDayExercise,
    resyncDayPlan,
  } = useStore();
  const [picking, setPicking] = useState(false);

  const today = startOfToday();
  const isToday = isoDate(date) === isoDate(today);
  const weekday = mondayIndex(date);
  const weekdayName = WEEKDAY_LONG[weekday].toLowerCase();
  const resolved = resolveDay(store, date);
  const { iso, template, plan, log } = resolved;
  const progress = dayProgress(resolved);
  const streak = currentStreak(store, today);

  const weeklyId = store.routine.week[weekday];
  const weeklyTemplate = weeklyId
    ? (store.templates.find((t) => t.id === weeklyId) ?? null)
    : null;
  const currentId = template?.id ?? null;
  const overridden = !!log && log.templateId !== weeklyId;
  const customized = plan?.customized ?? false;
  const orphanFrozen = !!log?.templateId && !template && plan?.frozen === true;
  const hasMarks =
    !!log && Object.values(log.sets).some((arr) => arr.some(Boolean));

  const [editing, setEditing] = useState(false);
  // Salir del modo edición al cambiar de fecha o de plantilla enlazada.
  useEffect(() => {
    setEditing(false);
    setPicking(false);
  }, [iso, currentId]);

  function pick(value: string) {
    const next = value || null;
    if (next === currentId) return;
    if (
      (hasMarks || customized) &&
      !confirm(
        "Cambiar el entreno de este día descarta lo que llevas y los ejercicios propios del día. ¿Seguir?",
      )
    )
      return;
    if (next === (weeklyId ?? null)) {
      resetDay(iso); // volver al plan de la semana
    } else {
      overrideDay(iso, next);
    }
  }

  return (
    <div className="screen">
      <div className="datenav">
        <button
          type="button"
          className="btn datenav__arrow"
          onClick={() => setDate((d) => addDays(d, -1))}
          aria-label="Día anterior"
        >
          {"<"}
        </button>
        <div className="datenav__center">
          <div className="datenav__weekday">{isToday ? "hoy" : weekdayName}</div>
          <div className="datenav__date">{formatLongDate(date)}</div>
        </div>
        <button
          type="button"
          className="btn datenav__arrow"
          onClick={() => setDate((d) => addDays(d, 1))}
          aria-label="Día siguiente"
        >
          {">"}
        </button>
      </div>

      {!isToday && (
        <button type="button" className="linkbtn" onClick={() => setDate(startOfToday())}>
          volver a hoy
        </button>
      )}

      <section className="card" data-type={plan?.type}>
        <div className="prompt">
          {plan
            ? `${DAY_TYPE_GLYPH[plan.type]} ${DAY_TYPE_LABEL[plan.type]}/${weekdayName} ▸ ${tplLabel(plan)}`
            : `descanso ▸ ${weekdayName}`}
        </div>

        <label className="f">
          <span className="f__label">entreno de este día</span>
          <select value={currentId ?? ""} onChange={(e) => pick(e.target.value)}>
            <option value="">— descanso —</option>
            {DAY_TYPES.map((type) => {
              const group = store.templates.filter((t) => t.type === type);
              if (group.length === 0) return null;
              return (
                <optgroup key={type} label={DAY_TYPE_LABEL[type]}>
                  {group.map((t) => (
                    <option key={t.id} value={t.id}>
                      {tplLabel(t)}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </label>

        {overridden && !orphanFrozen && (
          <div className="daynote">
            <span className="dim">
              cambio puntual · plan de la semana:{" "}
              {weeklyTemplate ? tplLabel(weeklyTemplate) : "descanso"}
            </span>
            <button type="button" className="linkbtn" onClick={() => resetDay(iso)}>
              restaurar plan de la semana
            </button>
          </div>
        )}

        {customized && !editing && (
          <div className="daynote">
            <span className="dim">
              ejercicios propios de este día · la plantilla no los toca
            </span>
            {template && (
              <button
                type="button"
                className="linkbtn"
                onClick={() => {
                  if (
                    confirm(
                      `¿Descartar los ejercicios propios de este día y volver a «${template.name}»?`,
                    )
                  )
                    resyncDayPlan(iso);
                }}
              >
                volver a «{template.name}»
              </button>
            )}
          </div>
        )}

        {orphanFrozen && (
          <div className="daynote">
            <span className="dim">plantilla borrada · plan fijado de este día</span>
          </div>
        )}

        {plan && editing && (
          <>
            <h3 className="rule rule--sm">ejercicios de este día</h3>
            {plan.exercises.length === 0 && <p className="dim">sin ejercicios</p>}
            <ol className="exedlist">
              {plan.exercises.map((ex, i) => (
                <ExerciseEditor
                  key={ex.id}
                  exercise={ex}
                  index={i}
                  count={plan.exercises.length}
                  onPatch={(patch) => updateDayExercise(iso, ex.id, patch)}
                  onMove={(dir) => moveDayExercise(iso, ex.id, dir)}
                  onDelete={() => deleteDayExercise(iso, ex.id)}
                />
              ))}
            </ol>
            {exerciseKindForType(plan.type) === "strength" && picking ? (
              <Suspense fallback={<p className="dim">cargando catálogo…</p>}>
                <CatalogPicker
                  onPick={(seed) => addDayLinkedExercise(iso, seed)}
                  onBlank={() => addDayExercise(iso)}
                  onClose={() => setPicking(false)}
                />
              </Suspense>
            ) : (
              <div className="btn-stack">
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    exerciseKindForType(plan.type) === "strength"
                      ? setPicking(true)
                      : addDayExercise(iso)
                  }
                >
                  [ + añadir ejercicio ]
                </button>
                <button type="button" className="btn" onClick={() => setEditing(false)}>
                  [ listo ]
                </button>
              </div>
            )}
          </>
        )}

        {plan && !editing && (
          <>
            {plan.exercises.length > 0 && (
              <>
                <AsciiBar
                  done={progress.doneSets}
                  total={progress.totalSets}
                  label={progress.rest ? "opcional" : "series"}
                />

                <ol className="exlist">
                  {plan.exercises.map((ex) => {
                    const done = log?.sets[ex.id] ?? [];
                    const doneCount = done.slice(0, ex.sets).filter(Boolean).length;
                    const exComplete = doneCount >= ex.sets;
                    return (
                      <li key={ex.id} className={exComplete ? "exrow is-done" : "exrow"}>
                        <div className="exrow__head">
                          <span className="exrow__name">{fmtExerciseName(ex)}</span>
                          <span className="exrow__spec">{fmtExerciseSpec(ex)}</span>
                        </div>
                        <SetBoxes
                          count={ex.sets}
                          done={done}
                          onToggle={(i) => toggleSet(iso, ex.id, i)}
                        />
                      </li>
                    );
                  })}
                </ol>

                {!progress.rest && progress.complete && (
                  <p className="ok">$ día completado ✔</p>
                )}
                {progress.rest &&
                  progress.totalExercises > 0 &&
                  progress.doneExercises === progress.totalExercises && (
                    <p className="ok">$ descanso activo hecho ✔</p>
                  )}
              </>
            )}

            {plan.exercises.length === 0 && plan.type !== "rest" && (
              <>
                <p className="dim">
                  «{plan.name}» no tiene ejercicios que marcar este día.
                </p>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setDayDone(iso, !progress.complete)}
                >
                  {progress.complete ? "[ desmarcar día ]" : "[ marcar día como hecho ]"}
                </button>
                {progress.complete && <p className="ok">$ día completado ✔</p>}
              </>
            )}

            {plan.exercises.length === 0 && plan.type === "rest" && (
              <p className="dim">Día de descanso. 🌙</p>
            )}

            {streak > 0 && !progress.rest && (
              <p className="dim">
                racha: {streak} día{streak === 1 ? "" : "s"}
              </p>
            )}

            <div className="btn-stack">
              <button type="button" className="btn" onClick={() => setEditing(true)}>
                [ editar ejercicios de este día ]
              </button>
              {hasMarks && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    if (confirm("¿Desmarcar todas las series de este día?")) clearSets(iso);
                  }}
                >
                  [ desmarcar series ]
                </button>
              )}
              {plan.exercises.length === 0 && plan.type !== "rest" && (
                <button
                  type="button"
                  className="linkbtn"
                  onClick={() => goTo("plantillas")}
                >
                  editar la plantilla &rarr;
                </button>
              )}
            </div>
          </>
        )}

        {!plan && (
          <p className="dim">
            {overridden
              ? "Has marcado este día como descanso."
              : "Día de descanso. Elige un entreno arriba si quieres entrenar."}
          </p>
        )}
      </section>
    </div>
  );
}
