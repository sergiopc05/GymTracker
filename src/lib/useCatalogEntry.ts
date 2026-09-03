import { useEffect, useState } from "react";
import type { CatalogExercise } from "../data/catalog";

/**
 * Resuelve un id de catálogo a su ficha, cargando `catalog.json` de forma perezosa
 * (import dinámico → chunk aparte). Devuelve `null` mientras carga o si el id no existe.
 */
export function useCatalogEntry(
  catalogId: string | undefined,
): CatalogExercise | null {
  const [entry, setEntry] = useState<CatalogExercise | null>(null);
  useEffect(() => {
    if (!catalogId) {
      setEntry(null);
      return;
    }
    let alive = true;
    void import("../data/catalog").then((m) => {
      if (alive) setEntry(m.catalogById.get(catalogId) ?? null);
    });
    return () => {
      alive = false;
    };
  }, [catalogId]);
  return entry;
}
