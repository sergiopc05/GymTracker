import { useState } from "react";
import { useStore } from "../store";
import { CheckRow } from "../components/CheckRow";
import { ProgressBar } from "../components/ProgressBar";
import {
  WEEKDAY_LONG,
  addDays,
  formatLongDate,
  isoDate,
  mondayIndex,
  startOfToday,
} from "../lib/dates";
import { currentStreak, dayProgress, getDayPlan, getLog } from "../lib/progress";
import type { TabKey } from "../components/TabBar";

interface Props {
  goTo: (tab: TabKey) => void;
}

export function TodayScreen({ goTo }: Props) {
  const { store, toggleGym, toggleRun, resetDay } = useStore();
  const [date, setDate] = useState(startOfToday);

  const today = startOfToday();
  const iso = isoDate(date);
  const isToday = iso === isoDate(today);
  const plan = getDayPlan(store.routine, date);
  const log = getLog(store.logs, date);
  const progress = dayProgress(plan, log);
  const streak = currentStreak(store.routine, store.logs, today);
  const hasLog = !!store.logs[iso];
  const weekdayName = WEEKDAY_LONG[mondayIndex(date)];

  return (
    <div className="screen">
      <div className="datenav">
        <button
          type="button"
          className="datenav__arrow"
          onClick={() => setDate((d) => addDays(d, -1))}
          aria-label="Día anterior"
        >
          ‹
        </button>
        <div className="datenav__center">
          <div className="datenav__weekday">{isToday ? "Hoy" : weekdayName}</div>
          <div className="datenav__date">{formatLongDate(date)}</div>
        </div>
        <button
          type="button"
          className="datenav__arrow"
          onClick={() => setDate((d) => addDays(d, 1))}
          disabled={iso >= isoDate(today)}
          aria-label="Día siguiente"
        >
          ›
        </button>
      </div>

      {!isToday && (
        <button type="button" className="linkbtn" onClick={() => setDate(startOfToday())}>
          Volver a hoy
        </button>
      )}

      <div className="daycard">
        <div className="daycard__head">
          <h2>{plan.rest ? "Descanso" : plan.title || weekdayName}</h2>
          {streak > 0 && (
            <span className="streak" title="Racha de días completados">
              🔥 {streak}
            </span>
          )}
        </div>

        {plan.rest ? (
          <p className="muted">
            Día de descanso. Disfrútalo. 🌙
            <br />
            <button type="button" className="linkbtn" onClick={() => goTo("editar")}>
              Cambiar el plan de este día
            </button>
          </p>
        ) : !progress.hasPlan ? (
          <p className="muted">
            No hay nada planificado para {weekdayName.toLowerCase()}.
            <br />
            <button type="button" className="linkbtn" onClick={() => goTo("editar")}>
              Añadir ejercicios
            </button>
          </p>
        ) : (
          <>
            <ProgressBar done={progress.done} total={progress.total} label="Completado" />

            {plan.gym.length > 0 && (
              <section className="group">
                <h3 className="group__title">Gimnasio</h3>
                <div className="rows">
                  {plan.gym.map((ex) => (
                    <CheckRow
                      key={ex.id}
                      checked={!!log.gym[ex.id]}
                      label={ex.name}
                      onToggle={() => toggleGym(iso, ex.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {plan.runs.length > 0 && (
              <section className="group">
                <h3 className="group__title">Running</h3>
                <div className="rows">
                  {plan.runs.map((run) => (
                    <CheckRow
                      key={run.id}
                      checked={!!log.runs[run.id]}
                      label={run.label}
                      onToggle={() => toggleRun(iso, run.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {progress.complete && (
              <p className="done-banner">Día completado. Buen trabajo. ✅</p>
            )}

            {hasLog && (
              <button
                type="button"
                className="ghostbtn"
                onClick={() => {
                  if (confirm("¿Desmarcar todos los ejercicios de este día?")) resetDay(iso);
                }}
              >
                Reiniciar día
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
