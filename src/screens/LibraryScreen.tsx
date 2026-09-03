import { useMemo, useState } from "react";
import { useStore } from "../store";
import { exerciseKindForType } from "../types";
import type { CustomExercise } from "../types";
import { CATALOG, catalogImageUrl, type CatalogExercise } from "../data/catalog";
import { searchCatalog } from "../lib/catalogSearch";
import {
  CATEGORY_ES,
  EQUIPMENT,
  EQUIPMENT_ES,
  FORCE_ES,
  LEVEL_ES,
  MECHANIC_ES,
  MUSCLES,
  MUSCLE_ES,
  type Equipment,
  type Muscle,
} from "../lib/catalogVocab";
import { ExercisePhoto } from "../components/ExercisePhoto";
import { CustomExerciseForm } from "../components/CustomExerciseForm";

const MAX_RESULTS = 60;

type Open =
  | { kind: "cat"; entry: CatalogExercise }
  | { kind: "cx"; id: string }
  | null;

export default function LibraryScreen() {
  const { store, deleteCustomExercise, addLinkedExercise } = useStore();

  const [view, setView] = useState<"catalogo" | "mios">("catalogo");
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const [equip, setEquip] = useState<Equipment | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [open, setOpen] = useState<Open>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CustomExercise | null>(null);

  const results = useMemo(() => {
    if (!query.trim() && !muscle && !equip) return [];
    return searchCatalog(CATALOG, { query, muscle, equip });
  }, [query, muscle, equip]);

  const strengthTemplates = store.templates.filter(
    (t) => exerciseKindForType(t.type) === "strength",
  );

  // ---------------------------------------------------------------- formulario
  if (creating || editing) {
    return (
      <CustomExerciseForm
        initial={editing ?? undefined}
        onDone={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    );
  }

  // ---------------------------------------------------------------- ficha catálogo
  if (open?.kind === "cat") {
    const e = open.entry;
    return (
      <div className="screen libdetail">
        <button type="button" className="linkbtn" onClick={() => setOpen(null)}>
          &larr; biblioteca
        </button>
        <ExercisePhoto
          className="libphoto"
          src={e.hasImage ? catalogImageUrl(e.id) : null}
          alt={e.nameEs}
        />
        <h2 className="rule">{e.nameEs}</h2>
        {e.name !== e.nameEs && <p className="dim">{e.name}</p>}

        <div className="chiprow">
          {e.primaryMuscles.map((m) => (
            <span key={m} className="chip is-sel">
              {MUSCLE_ES[m]}
            </span>
          ))}
          {e.secondaryMuscles.map((m) => (
            <span key={m} className="chip">
              {MUSCLE_ES[m]}
            </span>
          ))}
        </div>
        <p className="dim libdetail__meta">
          {e.equipment ? EQUIPMENT_ES[e.equipment] : "sin material"} ·{" "}
          {CATEGORY_ES[e.category]} · {LEVEL_ES[e.level]}
          {e.mechanic ? ` · ${MECHANIC_ES[e.mechanic]}` : ""}
          {e.force ? ` · ${FORCE_ES[e.force]}` : ""}
        </p>

        {e.instructionsEs.length > 0 && (
          <>
            <h3 className="rule rule--sm">instrucciones</h3>
            <ol className="libsteps">
              {e.instructionsEs.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </>
        )}

        <AddToTemplate
          templates={strengthTemplates}
          onAdd={(templateId) =>
            addLinkedExercise(templateId, { name: e.nameEs, catalogId: e.id })
          }
        />
      </div>
    );
  }

  // ---------------------------------------------------------------- ficha propia
  if (open?.kind === "cx") {
    const cx = store.customExercises.find((c) => c.id === open.id);
    if (!cx) {
      setOpen(null);
      return null;
    }
    return (
      <div className="screen libdetail">
        <button type="button" className="linkbtn" onClick={() => setOpen(null)}>
          &larr; biblioteca
        </button>
        <ExercisePhoto className="libphoto" src={cx.photo ?? null} alt={cx.nameEs} />
        <h2 className="rule">{cx.nameEs}</h2>
        <div className="chiprow">
          {cx.primaryMuscles.map((m) => (
            <span key={m} className="chip is-sel">
              {MUSCLE_ES[m]}
            </span>
          ))}
          {cx.equipment && <span className="chip">{EQUIPMENT_ES[cx.equipment]}</span>}
        </div>
        {cx.instructions && cx.instructions.length > 0 && (
          <>
            <h3 className="rule rule--sm">instrucciones</h3>
            <ol className="libsteps">
              {cx.instructions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </>
        )}
        <div className="btn-stack">
          <button
            type="button"
            className="btn"
            onClick={() => {
              setEditing(cx);
              setOpen(null);
            }}
          >
            [ editar ]
          </button>
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              if (confirm(`¿Borrar «${cx.nameEs}»? Las plantillas que lo usan conservan el nombre pero pierden la ficha.`)) {
                deleteCustomExercise(cx.id);
                setOpen(null);
              }
            }}
          >
            [ borrar ]
          </button>
        </div>
        <AddToTemplate
          templates={strengthTemplates}
          onAdd={(templateId) =>
            addLinkedExercise(templateId, { name: cx.nameEs, customExerciseId: cx.id })
          }
        />
      </div>
    );
  }

  // ---------------------------------------------------------------- lista
  return (
    <div className="screen">
      <h2 className="rule">biblioteca</h2>

      <div className="libtabs">
        <button
          type="button"
          className={view === "catalogo" ? "btn is-on" : "btn"}
          onClick={() => setView("catalogo")}
        >
          [ catálogo ]
        </button>
        <button
          type="button"
          className={view === "mios" ? "btn is-on" : "btn"}
          onClick={() => setView("mios")}
        >
          [ mis ejercicios ]
        </button>
      </div>

      {view === "catalogo" ? (
        <>
          <input
            className="libsearch"
            type="search"
            value={query}
            placeholder="buscar ejercicio (es / en)…"
            onChange={(e) => setQuery(e.target.value)}
          />

          <button
            type="button"
            className="linkbtn"
            onClick={() => setShowFilters((v) => !v)}
          >
            {showFilters ? "ocultar filtros" : "filtros"}
            {(muscle || equip) && !showFilters ? " ·" : ""}
            {muscle && !showFilters ? ` ${MUSCLE_ES[muscle]}` : ""}
            {equip && !showFilters ? ` ${EQUIPMENT_ES[equip]}` : ""}
          </button>

          {showFilters && (
            <>
              <h3 className="rule rule--sm">músculo</h3>
              <div className="chiprow">
                {MUSCLES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={m === muscle ? "chip is-sel" : "chip"}
                    onClick={() => setMuscle(m === muscle ? null : m)}
                  >
                    {MUSCLE_ES[m]}
                  </button>
                ))}
              </div>
              <h3 className="rule rule--sm">material</h3>
              <div className="chiprow">
                {EQUIPMENT.map((eq) => (
                  <button
                    key={eq}
                    type="button"
                    className={eq === equip ? "chip is-sel" : "chip"}
                    onClick={() => setEquip(eq === equip ? null : eq)}
                  >
                    {EQUIPMENT_ES[eq]}
                  </button>
                ))}
              </div>
            </>
          )}

          {results.length === 0 ? (
            <p className="dim">busca un ejercicio o elige un músculo.</p>
          ) : (
            <>
              <ul className="liblist">
                {results.slice(0, MAX_RESULTS).map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      className="librow"
                      onClick={() => setOpen({ kind: "cat", entry: e })}
                    >
                      <ExercisePhoto
                        className="librow__thumb"
                        src={e.hasImage ? catalogImageUrl(e.id) : null}
                        alt=""
                      />
                      <span className="librow__body">
                        <span className="librow__name">{e.nameEs}</span>
                        <span className="librow__sub">
                          {e.primaryMuscles.map((m) => MUSCLE_ES[m]).join(", ")}
                          {e.equipment ? ` · ${EQUIPMENT_ES[e.equipment]}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {results.length > MAX_RESULTS && (
                <p className="dim">
                  +{results.length - MAX_RESULTS} más — afina la búsqueda
                </p>
              )}
            </>
          )}
        </>
      ) : (
        <>
          {store.customExercises.length === 0 ? (
            <p className="dim">Aún no has creado ningún ejercicio.</p>
          ) : (
            <ul className="liblist">
              {store.customExercises.map((cx) => (
                <li key={cx.id}>
                  <button
                    type="button"
                    className="librow"
                    onClick={() => setOpen({ kind: "cx", id: cx.id })}
                  >
                    <ExercisePhoto
                      className="librow__thumb"
                      src={cx.photo ?? null}
                      alt=""
                    />
                    <span className="librow__body">
                      <span className="librow__name">{cx.nameEs}</span>
                      <span className="librow__sub">
                        {cx.primaryMuscles.map((m) => MUSCLE_ES[m]).join(", ") || "propio"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="btn" onClick={() => setCreating(true)}>
            [ + crear ejercicio ]
          </button>
        </>
      )}
    </div>
  );
}

// -------------------------------------------------------------------- añadir a plantilla

function AddToTemplate({
  templates,
  onAdd,
}: {
  templates: { id: string; name: string; emoji?: string }[];
  onAdd: (templateId: string) => void;
}) {
  const [pick, setPick] = useState("");
  const [added, setAdded] = useState<string | null>(null);

  if (templates.length === 0) {
    return (
      <p className="dim">Crea una plantilla de gym o core para poder añadirlo.</p>
    );
  }

  return (
    <div className="daynote">
      {added ? (
        <span className="ok">$ añadido a «{added}» ✔</span>
      ) : (
        <label className="f">
          <span className="f__label">añadir a un entreno</span>
          <select
            value={pick}
            onChange={(e) => {
              const t = templates.find((x) => x.id === e.target.value);
              if (!t) return;
              onAdd(t.id);
              setAdded(t.name);
              setPick("");
            }}
          >
            <option value="">— elegir plantilla —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji ? `${t.emoji} ${t.name}` : t.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
