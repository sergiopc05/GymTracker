// Vocabulario cerrado del catálogo de ejercicios (free-exercise-db) + etiquetas en español.
// Archivo pequeño y seguro de importar desde cualquier sitio (no arrastra el catálogo).

export const MUSCLES = [
  "abdominals",
  "abductors",
  "adductors",
  "biceps",
  "calves",
  "chest",
  "forearms",
  "glutes",
  "hamstrings",
  "lats",
  "lower back",
  "middle back",
  "neck",
  "quadriceps",
  "shoulders",
  "traps",
  "triceps",
] as const;
export type Muscle = (typeof MUSCLES)[number];

export const EQUIPMENT = [
  "body only",
  "bands",
  "barbell",
  "cable",
  "dumbbell",
  "e-z curl bar",
  "exercise ball",
  "foam roll",
  "kettlebells",
  "machine",
  "medicine ball",
  "other",
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const CATEGORIES = [
  "strength",
  "stretching",
  "plyometrics",
  "powerlifting",
  "olympic weightlifting",
  "strongman",
  "cardio",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const LEVELS = ["beginner", "intermediate", "expert"] as const;
export type Level = (typeof LEVELS)[number];

export const FORCES = ["push", "pull", "static"] as const;
export type Force = (typeof FORCES)[number];

export const MECHANICS = ["compound", "isolation"] as const;
export type Mechanic = (typeof MECHANICS)[number];

export const MUSCLE_ES: Record<Muscle, string> = {
  abdominals: "abdominales",
  abductors: "abductores",
  adductors: "aductores",
  biceps: "bíceps",
  calves: "gemelos",
  chest: "pecho",
  forearms: "antebrazos",
  glutes: "glúteos",
  hamstrings: "isquiotibiales",
  lats: "dorsales",
  "lower back": "zona lumbar",
  "middle back": "espalda media",
  neck: "cuello",
  quadriceps: "cuádriceps",
  shoulders: "hombros",
  traps: "trapecio",
  triceps: "tríceps",
};

export const EQUIPMENT_ES: Record<Equipment, string> = {
  "body only": "peso corporal",
  bands: "banda elástica",
  barbell: "barra",
  cable: "polea",
  dumbbell: "mancuerna",
  "e-z curl bar": "barra z",
  "exercise ball": "fitball",
  "foam roll": "foam roller",
  kettlebells: "pesa rusa",
  machine: "máquina",
  "medicine ball": "balón medicinal",
  other: "otro",
};

export const CATEGORY_ES: Record<Category, string> = {
  strength: "fuerza",
  stretching: "estiramiento",
  plyometrics: "pliometría",
  powerlifting: "powerlifting",
  "olympic weightlifting": "halterofilia",
  strongman: "strongman",
  cardio: "cardio",
};

export const LEVEL_ES: Record<Level, string> = {
  beginner: "principiante",
  intermediate: "intermedio",
  expert: "avanzado",
};

export const FORCE_ES: Record<Force, string> = {
  push: "empuje",
  pull: "tracción",
  static: "isométrico",
};

export const MECHANIC_ES: Record<Mechanic, string> = {
  compound: "compuesto",
  isolation: "aislamiento",
};

export function isMuscle(v: unknown): v is Muscle {
  return typeof v === "string" && (MUSCLES as readonly string[]).includes(v);
}
export function isEquipment(v: unknown): v is Equipment {
  return typeof v === "string" && (EQUIPMENT as readonly string[]).includes(v);
}
export function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);
}
export function isLevel(v: unknown): v is Level {
  return typeof v === "string" && (LEVELS as readonly string[]).includes(v);
}
export function isForce(v: unknown): v is Force {
  return typeof v === "string" && (FORCES as readonly string[]).includes(v);
}
export function isMechanic(v: unknown): v is Mechanic {
  return typeof v === "string" && (MECHANICS as readonly string[]).includes(v);
}
