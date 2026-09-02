import { useState, type FormEvent } from "react";
import { useStore } from "../store";
import { WEEKDAY_LONG, WEEKDAY_SHORT } from "../lib/dates";

interface Props {
  weekday: number;
  setWeekday: (weekday: number) => void;
}

export function EditScreen({ weekday, setWeekday }: Props) {
  const {
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
  } = useStore();

  const day = store.routine.days[weekday];
  const [newExercise, setNewExercise] = useState("");
  const [newRun, setNewRun] = useState("");

  function submitExercise(e: FormEvent) {
    e.preventDefault();
    addExercise(weekday, newExercise);
    setNewExercise("");
  }

  function submitRun(e: FormEvent) {
    e.preventDefault();
    addRun(weekday, newRun);
    setNewRun("");
  }

  return (
    <div className="screen">
      <h2 className="screen__title">Editar rutina</h2>

      <div className="weekday-picker">
        {WEEKDAY_SHORT.map((label, i) => (
          <button
            key={i}
            type="button"
            className={i === weekday ? "wd is-active" : "wd"}
            onClick={() => setWeekday(i)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="editcard">
        <label className="field">
          <span className="field__label">
            Nombre del entreno ({WEEKDAY_LONG[weekday]})
          </span>
          <input
            type="text"
            value={day.title}
            placeholder="p.ej. Empuje, Rodaje, Pierna"
            onChange={(e) => setDayTitle(weekday, e.target.value)}
          />
        </label>

        <label className="toggle">
          <input
            type="checkbox"
            checked={day.rest}
            onChange={(e) => setRest(weekday, e.target.checked)}
          />
          <span>Día de descanso</span>
        </label>

        {!day.rest && (
          <>
            <section className="group">
              <h3 className="group__title">Gimnasio</h3>
              {day.gym.length === 0 && <p className="muted">Sin ejercicios.</p>}
              <ul className="editlist">
                {day.gym.map((ex, i) => (
                  <li key={ex.id} className="edititem">
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => renameExercise(weekday, ex.id, e.target.value)}
                    />
                    <div className="edititem__actions">
                      <button
                        type="button"
                        onClick={() => moveExercise(weekday, ex.id, -1)}
                        disabled={i === 0}
                        aria-label="Subir"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveExercise(weekday, ex.id, 1)}
                        disabled={i === day.gym.length - 1}
                        aria-label="Bajar"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => deleteExercise(weekday, ex.id)}
                        aria-label="Borrar"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <form className="addrow" onSubmit={submitExercise}>
                <input
                  type="text"
                  value={newExercise}
                  placeholder="Añadir ejercicio"
                  onChange={(e) => setNewExercise(e.target.value)}
                />
                <button type="submit">Añadir</button>
              </form>
            </section>

            <section className="group">
              <h3 className="group__title">Running</h3>
              {day.runs.length === 0 && <p className="muted">Sin carreras.</p>}
              <ul className="editlist">
                {day.runs.map((run, i) => (
                  <li key={run.id} className="edititem">
                    <input
                      type="text"
                      value={run.label}
                      onChange={(e) => renameRun(weekday, run.id, e.target.value)}
                    />
                    <div className="edititem__actions">
                      <button
                        type="button"
                        onClick={() => moveRun(weekday, run.id, -1)}
                        disabled={i === 0}
                        aria-label="Subir"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRun(weekday, run.id, 1)}
                        disabled={i === day.runs.length - 1}
                        aria-label="Bajar"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => deleteRun(weekday, run.id)}
                        aria-label="Borrar"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <form className="addrow" onSubmit={submitRun}>
                <input
                  type="text"
                  value={newRun}
                  placeholder="Añadir carrera (p.ej. 5 km suave)"
                  onChange={(e) => setNewRun(e.target.value)}
                />
                <button type="submit">Añadir</button>
              </form>
            </section>
          </>
        )}
      </div>

      <div className="editcard">
        <h3 className="group__title">Rutina completa</h3>
        <div className="btn-stack">
          <button
            type="button"
            className="ghostbtn"
            onClick={() => {
              if (
                confirm(
                  "¿Cargar la rutina de ejemplo? Sustituirá tu rutina actual (los ejercicios ya marcados no se pierden).",
                )
              )
                loadExample();
            }}
          >
            Cargar rutina de ejemplo
          </button>
          <button
            type="button"
            className="ghostbtn danger"
            onClick={() => {
              if (confirm("¿Vaciar toda la rutina y dejar los 7 días en descanso?"))
                clearRoutine();
            }}
          >
            Vaciar rutina
          </button>
        </div>
      </div>
    </div>
  );
}
