import { useState } from "react";
import { useStore } from "../store";
import { SetBoxes } from "../components/SetBoxes";
import { AsciiBar } from "../components/AsciiBar";
import type { TabKey } from "../components/TabBar";
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
  DAY_TYPE_LABEL,
  fmtExerciseName,
  fmtExerciseSpec,
} from "../lib/format";

interface Props {
  goTo: (tab: TabKey) => void;
}

export function TodayScreen({ goTo }: Props) {
  const { store, toggleSet, resetDay } = useStore();
  const [date, setDate] = useState(startOfToday);

  const today = startOfToday();
  const isToday = isoDate(date) === isoDate(today);
  const weekday = mondayIndex(date);
  const resolved = resolveDay(store, date);
  const { iso, template, log } = resolved;
  const progress = dayProgress(resolved);
  const streak = currentStreak(store, today);

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
          <div className="datenav__weekday">
            {isToday ? "hoy" : WEEKDAY_LONG[weekday].toLowerCase()}
          </div>
          <div className="datenav__date">{formatLongDate(date)}</div>
        </div>
        <button
          type="button"
          className="btn datenav__arrow"
          onClick={() => setDate((d) => addDays(d, 1))}
          disabled={iso >= isoDate(today)}
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

      {!template ? (
        <section className="card">
          <div className="prompt">descanso ▸ {WEEKDAY_LONG[weekday].toLowerCase()}</div>
          <p className="dim">Día de descanso. No hay plantilla asignada.</p>
          <button type="button" className="linkbtn" onClick={() => goTo("semana")}>
            asignar plantilla &rarr;
          </button>
        </section>
      ) : (
        <section className="card">
          <div className="prompt">
            {DAY_TYPE_LABEL[template.type]}/{WEEKDAY_LONG[weekday].toLowerCase()} ▸ {template.name}
          </div>

          {!progress.hasPlan ? (
            <>
              <p className="dim">La plantilla «{template.name}» no tiene ejercicios.</p>
              <button type="button" className="linkbtn" onClick={() => goTo("plantillas")}>
                editar plantilla &rarr;
              </button>
            </>
          ) : (
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

              {streak > 0 && <p className="dim">racha: {streak} día{streak === 1 ? "" : "s"}</p>}

              {store.logs[iso] && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    if (confirm("¿Desmarcar todas las series de este día?")) resetDay(iso);
                  }}
                >
                  [ reiniciar día ]
                </button>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
