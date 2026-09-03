// Catálogo de ejercicios (free-exercise-db, dominio público), traducido al español.
//
// IMPORTANTE: este módulo arrastra ~1,5 MB de datos. NO lo importes desde módulos que se
// cargan al arrancar (store.tsx, App.tsx, lib/*). Solo desde pantallas/paneles lazy
// (LibraryScreen, CatalogPicker) para que quede en un chunk aparte.

import catalogJson from "./catalog.json?raw";
import type {
  Category,
  Equipment,
  Force,
  Level,
  Mechanic,
  Muscle,
} from "../lib/catalogVocab";

export interface CatalogExercise {
  /** id de free-exercise-db; coincide con el nombre del archivo webp. */
  id: string;
  /** Nombre en inglés (para búsqueda). */
  name: string;
  /** Nombre en español (display + búsqueda). */
  nameEs: string;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  equipment: Equipment | null;
  category: Category;
  level: Level;
  mechanic: Mechanic | null;
  force: Force | null;
  /** Pasos en español. */
  instructionsEs: string[];
  hasImage: boolean;
}

/** Ordenado por `nameEs` (orden de la lista). */
export const CATALOG: CatalogExercise[] = JSON.parse(catalogJson);

export const catalogById: Map<string, CatalogExercise> = new Map(
  CATALOG.map((e) => [e.id, e]),
);

export { catalogImageUrl } from "../lib/catalogImage";
