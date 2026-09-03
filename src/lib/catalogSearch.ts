import type { CatalogExercise } from "../data/catalog";
import type { Equipment, Muscle } from "./catalogVocab";

/** Minúsculas + sin acentos, para comparar sin importar tildes. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export interface CatalogFilters {
  query: string;
  muscle: Muscle | null;
  equip: Equipment | null;
}

/** Filtra el catálogo por texto (español o inglés), músculo y material. */
export function searchCatalog(
  all: CatalogExercise[],
  { query, muscle, equip }: CatalogFilters,
): CatalogExercise[] {
  const q = normalize(query.trim());
  return all.filter((e) => {
    if (
      muscle &&
      !e.primaryMuscles.includes(muscle) &&
      !e.secondaryMuscles.includes(muscle)
    )
      return false;
    if (equip && e.equipment !== equip) return false;
    if (q && !normalize(e.nameEs).includes(q) && !normalize(e.name).includes(q))
      return false;
    return true;
  });
}
