import { useState, type FormEvent } from "react";
import { useStore } from "../store";
import { DAY_TYPES, exerciseKindForType, type DayType } from "../types";
import { DAY_TYPE_LABEL, fmtExerciseCount } from "../lib/format";
import { ExerciseEditor } from "../components/ExerciseEditor";

interface Props {
  openId: string | null;
  setOpenId: (id: string | null) => void;
}

export function TemplatesScreen({ openId, setOpenId }: Props) {
  const {
    store,
    createTemplate,
    renameTemplate,
    setTemplateType,
    deleteTemplate,
    addExercise,
    updateExercise,
    deleteExercise,
    moveExercise,
  } = useStore();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<DayType>("gym");

  const open = openId ? store.templates.find((t) => t.id === openId) ?? null : null;
  const assignedCount = (id: string) =>
    store.routine.week.filter((w) => w === id).length;

  function submitNew(e: FormEvent) {
    e.preventDefault();
    const created = createTemplate(newName, newType);
    setNewName("");
    setCreating(false);
    setOpenId(created);
  }

  // ---------------------------------------------------------------- editor
  if (open) {
    const assigned = assignedCount(open.id);
    return (
      <div className="screen">
        <button type="button" className="linkbtn" onClick={() => setOpenId(null)}>
          &larr; plantillas
        </button>

        <section className="card">
          <label className="f">
            <span className="f__label">nombre</span>
            <input
              type="text"
              value={open.name}
              onChange={(e) => renameTemplate(open.id, e.target.value)}
            />
          </label>

          <label className="f">
            <span className="f__label">tipo</span>
            <select
              value={open.type}
              onChange={(e) => {
                const next = e.target.value as DayType;
                const wipes =
                  open.exercises.length > 0 &&
                  exerciseKindForType(open.type) !== exerciseKindForType(next);
                if (
                  wipes &&
                  !confirm(
                    `Cambiar a «${DAY_TYPE_LABEL[next]}» vaciará los ${open.exercises.length} ejercicios. ¿Seguir?`,
                  )
                )
                  return;
                setTemplateType(open.id, next);
              }}
            >
              {DAY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {DAY_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>

          {assigned > 0 && (
            <p className="dim">
              asignada a {assigned} día{assigned === 1 ? "" : "s"} de la semana
            </p>
          )}
        </section>

        <section className="card">
          <h3 className="rule rule--sm">ejercicios</h3>
          {open.exercises.length === 0 && <p className="dim">sin ejercicios</p>}
          <ol className="exedlist">
            {open.exercises.map((ex, i) => (
              <ExerciseEditor
                key={ex.id}
                exercise={ex}
                index={i}
                count={open.exercises.length}
                onPatch={(patch) => updateExercise(open.id, ex.id, patch)}
                onMove={(dir) => moveExercise(open.id, ex.id, dir)}
                onDelete={() => deleteExercise(open.id, ex.id)}
              />
            ))}
          </ol>
          <button type="button" className="btn" onClick={() => addExercise(open.id)}>
            [ + añadir ejercicio ]
          </button>
        </section>

        <button
          type="button"
          className="btn danger"
          onClick={() => {
            const msg =
              assigned > 0
                ? `«${open.name}» está asignada a ${assigned} día${assigned === 1 ? "" : "s"}, que pasarán a descanso. ¿Borrar?`
                : `¿Borrar la plantilla «${open.name}»?`;
            if (confirm(msg)) {
              deleteTemplate(open.id);
              setOpenId(null);
            }
          }}
        >
          [ borrar plantilla ]
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------- lista
  return (
    <div className="screen">
      <h2 className="rule">plantillas</h2>

      {store.templates.length === 0 && !creating && (
        <p className="dim">
          Sin plantillas todavía. Crea una y asígnala a los días en «semana».
        </p>
      )}

      {DAY_TYPES.map((type) => {
        const group = store.templates.filter((t) => t.type === type);
        if (group.length === 0) return null;
        return (
          <section key={type} className="tplgroup">
            <h3 className="rule rule--sm">{DAY_TYPE_LABEL[type]}</h3>
            <div className="tpllist">
              {group.map((t) => {
                const a = assignedCount(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    className="tplrow"
                    onClick={() => setOpenId(t.id)}
                  >
                    <span className="tplrow__name">{t.name}</span>
                    <span className="tplrow__sub">
                      {fmtExerciseCount(t.exercises.length)}
                      {a > 0 ? ` · ${a}×semana` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {creating ? (
        <form className="card" onSubmit={submitNew}>
          <label className="f">
            <span className="f__label">nombre</span>
            <input
              type="text"
              autoFocus
              value={newName}
              placeholder="empuje a, rodaje largo…"
              onChange={(e) => setNewName(e.target.value)}
            />
          </label>
          <label className="f">
            <span className="f__label">tipo</span>
            <select value={newType} onChange={(e) => setNewType(e.target.value as DayType)}>
              {DAY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {DAY_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
          <div className="frow">
            <button type="submit" className="btn">
              [ crear ]
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setCreating(false);
                setNewName("");
              }}
            >
              [ cancelar ]
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn" onClick={() => setCreating(true)}>
          [ + nueva plantilla ]
        </button>
      )}
    </div>
  );
}
