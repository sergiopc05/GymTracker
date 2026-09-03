import { useStore } from "../store";
import { useCatalogEntry } from "../lib/useCatalogEntry";
import { catalogImageUrl } from "../lib/catalogImage";
import { ExercisePhoto } from "./ExercisePhoto";
import { EQUIPMENT_ES, MUSCLE_ES, type Equipment, type Muscle } from "../lib/catalogVocab";
import type { StrengthExercise } from "../types";

interface Ficha {
  photo: string | null;
  enName: string | null;
  muscles: Muscle[];
  equipment: Equipment | null;
  steps: string[];
}

/**
 * Ficha desplegable de un ejercicio de fuerza vinculado: foto + músculos + instrucciones.
 * Resuelve tanto un vínculo con el catálogo (carga perezosa) como uno propio (del store).
 */
export function ExerciseFicha({ ex }: { ex: StrengthExercise }) {
  const { store } = useStore();
  const entry = useCatalogEntry(ex.catalogId);
  const cx = ex.customExerciseId
    ? store.customExercises.find((c) => c.id === ex.customExerciseId)
    : null;

  if (ex.catalogId && !entry)
    return <p className="dim exficha__load">cargando ficha…</p>;
  if (ex.customExerciseId && !cx)
    return <p className="dim exficha__load">este ejercicio propio ya no existe.</p>;

  const ficha: Ficha = entry
    ? {
        photo: entry.hasImage ? catalogImageUrl(entry.id) : null,
        enName: entry.name !== entry.nameEs ? entry.name : null,
        muscles: entry.primaryMuscles,
        equipment: entry.equipment,
        steps: entry.instructionsEs,
      }
    : {
        photo: cx?.photo ?? null,
        enName: null,
        muscles: cx?.primaryMuscles ?? [],
        equipment: cx?.equipment ?? null,
        steps: cx?.instructions ?? [],
      };

  return (
    <div className="exficha">
      <ExercisePhoto className="exficha__photo" src={ficha.photo} alt="" />
      {ficha.enName && <p className="dim exficha__en">{ficha.enName}</p>}
      {(ficha.muscles.length > 0 || ficha.equipment) && (
        <p className="dim exficha__meta">
          {ficha.muscles.map((m) => MUSCLE_ES[m]).join(", ")}
          {ficha.equipment ? ` · ${EQUIPMENT_ES[ficha.equipment]}` : ""}
        </p>
      )}
      {ficha.steps.length > 0 && (
        <ol className="libsteps">
          {ficha.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
