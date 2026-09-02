import { useState } from "react";
import { useStore } from "../store";
import { WEEKDAY_LONG, mondayIndex, startOfToday } from "../lib/dates";
import { DAY_TYPES } from "../types";
import {
  DAY_TYPE_LABEL,
  fmtExerciseCount,
  fmtExerciseName,
  fmtExerciseSpec,
} from "../lib/format";

interface Props {
  onEditTemplate: (templateId: string) => void;
}

export function WeekScreen({ onEditTemplate }: Props) {
  const { store, assignTemplate } = useStore();
  const todayWeekday = mondayIndex(startOfToday());
  const [open, setOpen] = useState<number | null>(todayWeekday);

  const byId = (id: string | null) =>
    id ? (store.templates.find((t) => t.id === id) ?? null) : null;

  return (
    <div className="screen">
      <h2 className="rule">semana</h2>

      {store.templates.length === 0 && (
        <p className="dim">
          Aún no hay plantillas. Créalas en la pestaña «plantillas» y luego asígnalas aquí.
        </p>
      )}

      <div className="weeklist">
        {store.routine.week.map((templateId, weekday) => {
          const tpl = byId(templateId);
          const isToday = weekday === todayWeekday;
          const isOpen = open === weekday;
          return (
            <div
              key={weekday}
              className={
                "weekrow" + (isToday ? " is-today" : "") + (isOpen ? " is-open" : "")
              }
            >
              <button
                type="button"
                className="weekrow__head"
                onClick={() => setOpen(isOpen ? null : weekday)}
              >
                <span className="weekrow__day">
                  {WEEKDAY_LONG[weekday].toLowerCase()}
                  {isToday && <span className="tag tag--today">hoy</span>}
                </span>
                <span className="weekrow__meta">
                  {tpl ? (
                    <>
                      <span className="weekrow__name">{tpl.name}</span>
                      <span className="weekrow__sub">
                        [{DAY_TYPE_LABEL[tpl.type]}] {fmtExerciseCount(tpl.exercises.length)}
                      </span>
                    </>
                  ) : (
                    <span className="weekrow__sub">descanso</span>
                  )}
                </span>
              </button>

              {isOpen && (
                <div className="weekrow__body">
                  {tpl && tpl.exercises.length > 0 && (
                    <ul className="plain-list">
                      {tpl.exercises.map((ex) => (
                        <li key={ex.id}>
                          <span className="plain-list__name">{fmtExerciseName(ex)}</span>
                          <span className="dim"> {fmtExerciseSpec(ex)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {tpl && tpl.exercises.length === 0 && (
                    <p className="dim">plantilla vacía</p>
                  )}

                  <label className="f">
                    <span className="f__label">asignar plantilla</span>
                    <select
                      value={templateId ?? ""}
                      onChange={(e) =>
                        assignTemplate(weekday, e.target.value || null)
                      }
                    >
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

                  {tpl && (
                    <button
                      type="button"
                      className="linkbtn"
                      onClick={() => onEditTemplate(tpl.id)}
                    >
                      editar «{tpl.name}» &rarr;
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
