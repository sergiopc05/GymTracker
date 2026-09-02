import { useState } from "react";
import { useStore } from "../store";
import { SetBoxes } from "../components/SetBoxes";
import { AsciiBar } from "../components/AsciiBar";
import type { TabKey } from "../components/TabBar";
import { DAY_TYPES } from "../types";
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
} from "../lib/format";

interface Props {
  goTo: (tab: TabKey) => void;
}

export function TodayScreen({ goTo }: Props) {
  const { store, toggleSet, overrideDay, resetDay, clearSets } = useStore();
  const [date, setDate] = useState(startOfToday);

  const today = startOfToday();
  const isToday = isoDate(date) === isoDate(today);
  const weekday = mondayIndex(date);
  const weekdayName = WEEKDAY_LONG[weekday].toLowerCase();
  const resolved = resolveDay(store, date);
  const { iso, template, log } = resolved;
  const progress = dayProgress(resolved);
  const streak = currentStreak(store, today);

  const weeklyId = store.routine.week[weekday];
  const weeklyTemplate = weeklyId
    ? (store.templates.find((t) => t.id === weeklyId) ?? null)
    : null;
  const currentId = template?.id ?? null;
  const overridden = !!log && log.templateId !== weeklyId;
  const hasMarks =
    !!log && Object.values(log.sets).some((arr) => arr.some(Boolean));

  function pick(value: string) {
    const next = value || null;
    if (next === currentId) return;
    if (
      hasMarks &&
      !confirm("Cambiar el entreno de este día desmarcará lo que llevas. ¿Seguir?")
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

      <section className="card" data-type={template?.type}>
        <div className="prompt">
          {template
            ? `${DAY_TYPE_GLYPH[template.type]} ${DAY_TYPE_LABEL[template.type]}/${weekdayName} ▸ ${template.name}`
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
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </label>

        {overridden && (
          <div className="daynote">
            <span className="dim">
              cambio puntual · plan de la semana:{" "}
              {weeklyTemplate ? weeklyTemplate.name : "descanso"}
            </span>
            <button type="button" className="linkbtn" onClick={() => resetDay(iso)}>
              restaurar plan de la semana
            </button>
          </div>
        )}

        {template && progress.hasPlan && (
          <>
            <AsciiBar done={progress.doneSets} total={progress.totalSets} label="series" />

            <ol className="exlist">
              {template.exercises.map((ex) => {
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
                      onToggle={(i) => toggleSet(iso, template.id, ex.id, i)}
                    />
                  </li>
                );
              })}
            </ol>

            {progress.complete && <p className="ok">$ día completado ✔</p>}
            {streak > 0 && (
              <p className="dim">
                racha: {streak} día{streak === 1 ? "" : "s"}
              </p>
            )}

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
          </>
        )}

        {template && !progress.hasPlan && (
          <>
            <p className="dim">La plantilla «{template.name}» no tiene ejercicios.</p>
            <button type="button" className="linkbtn" onClick={() => goTo("plantillas")}>
              editar plantilla &rarr;
            </button>
          </>
        )}

        {!template && (
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
