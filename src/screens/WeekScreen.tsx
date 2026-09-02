import { useState } from "react";
import { useStore } from "../store";
import { WEEKDAY_LONG, mondayIndex, startOfToday } from "../lib/dates";

interface Props {
  onEditDay: (weekday: number) => void;
}

function summary(gymCount: number, runCount: number, rest: boolean): string {
  if (rest) return "Descanso";
  if (gymCount === 0 && runCount === 0) return "Sin plan";
  const parts: string[] = [];
  if (gymCount > 0) parts.push(`${gymCount} ejercicio${gymCount === 1 ? "" : "s"}`);
  if (runCount > 0) parts.push(`${runCount} carrera${runCount === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

export function WeekScreen({ onEditDay }: Props) {
  const { store } = useStore();
  const todayWeekday = mondayIndex(startOfToday());
  const [open, setOpen] = useState<number | null>(todayWeekday);

  return (
    <div className="screen">
      <h2 className="screen__title">Semana</h2>
      <div className="weeklist">
        {store.routine.days.map((day) => {
          const isToday = day.weekday === todayWeekday;
          const isOpen = open === day.weekday;
          return (
            <div
              key={day.weekday}
              className={
                "weekrow" + (isToday ? " is-today" : "") + (isOpen ? " is-open" : "")
              }
            >
              <button
                type="button"
                className="weekrow__head"
                onClick={() => setOpen(isOpen ? null : day.weekday)}
              >
                <span className="weekrow__day">
                  {WEEKDAY_LONG[day.weekday]}
                  {isToday && <span className="pill pill--today">hoy</span>}
                </span>
                <span className="weekrow__meta">
                  {day.title && !day.rest ? (
                    <span className="weekrow__name">{day.title}</span>
                  ) : null}
                  <span className="weekrow__summary">
                    {summary(day.gym.length, day.runs.length, day.rest)}
                  </span>
                </span>
              </button>

              {isOpen && (
                <div className="weekrow__body">
                  {day.rest ? (
                    <p className="muted">Día de descanso.</p>
                  ) : day.gym.length === 0 && day.runs.length === 0 ? (
                    <p className="muted">Nada planificado todavía.</p>
                  ) : (
                    <>
                      {day.gym.length > 0 && (
                        <>
                          <h4 className="mini-title">Gimnasio</h4>
                          <ul className="plain-list">
                            {day.gym.map((e) => (
                              <li key={e.id}>{e.name}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {day.runs.length > 0 && (
                        <>
                          <h4 className="mini-title">Running</h4>
                          <ul className="plain-list">
                            {day.runs.map((r) => (
                              <li key={r.id}>{r.label}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    className="linkbtn"
                    onClick={() => onEditDay(day.weekday)}
                  >
                    Editar este día
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
