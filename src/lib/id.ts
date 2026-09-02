// Identificadores cortos y unicos para ejercicios / carreras.

export function id(prefix = ""): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36).slice(-4);
  return `${prefix}${time}${rand}`;
}
