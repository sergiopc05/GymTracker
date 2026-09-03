import { useMemo, useState } from "react";
import { useStore, type ExerciseSeed } from "../store";
import { CATALOG, catalogImageUrl } from "../data/catalog";
import { searchCatalog } from "../lib/catalogSearch";
import { EQUIPMENT_ES, MUSCLE_ES } from "../lib/catalogVocab";
import { ExercisePhoto } from "./ExercisePhoto";

interface Props {
  onPick: (seed: ExerciseSeed) => void;
  onBlank: () => void;
  onClose: () => void;
}

/** Selector inline de ejercicio: catálogo o propios, o "en blanco". */
export default function CatalogPicker({ onPick, onBlank, onClose }: Props) {
  const { store } = useStore();
  const [tab, setTab] = useState<"cat" | "mios">("cat");
  const [query, setQuery] = useState("");

  const results = useMemo(
    () =>
      query.trim()
        ? searchCatalog(CATALOG, { query, muscle: null, equip: null }).slice(0, 40)
        : [],
    [query],
  );

  return (
    <div className="catpick">
      <div className="libtabs">
        <button
          type="button"
          className={tab === "cat" ? "btn is-on" : "btn"}
          onClick={() => setTab("cat")}
        >
          [ catálogo ]
        </button>
        <button
          type="button"
          className={tab === "mios" ? "btn is-on" : "btn"}
          onClick={() => setTab("mios")}
        >
          [ míos ]
        </button>
        <button type="button" className="btn" onClick={onClose}>
          [ cerrar ]
        </button>
      </div>

      {tab === "cat" ? (
        <>
          <input
            className="libsearch"
            type="search"
            autoFocus
            value={query}
            placeholder="buscar ejercicio…"
            onChange={(e) => setQuery(e.target.value)}
          />
          {query.trim() === "" ? (
            <p className="dim">escribe para buscar en el catálogo.</p>
          ) : results.length === 0 ? (
            <p className="dim">nada — prueba otra palabra.</p>
          ) : (
            <ul className="liblist">
              {results.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    className="librow"
                    onClick={() => {
                      onPick({ name: e.nameEs, catalogId: e.id });
                      onClose();
                    }}
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
          )}
        </>
      ) : store.customExercises.length === 0 ? (
        <p className="dim">
          No tienes ejercicios propios. Créalos en la pestaña «biblio».
        </p>
      ) : (
        <ul className="liblist">
          {store.customExercises.map((cx) => (
            <li key={cx.id}>
              <button
                type="button"
                className="librow"
                onClick={() => {
                  onPick({ name: cx.nameEs, customExerciseId: cx.id });
                  onClose();
                }}
              >
                <ExercisePhoto
                  className="librow__thumb"
                  src={cx.photo ?? null}
                  alt=""
                />
                <span className="librow__body">
                  <span className="librow__name">{cx.nameEs}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="btn"
        onClick={() => {
          onBlank();
          onClose();
        }}
      >
        [ + ejercicio en blanco ]
      </button>
    </div>
  );
}
