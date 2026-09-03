// Genera el catálogo de ejercicios de la app a partir de free-exercise-db.
//
// USO (una sola vez, en local — CI NUNCA ejecuta esto):
//   1. git clone --depth 1 https://github.com/yuhonas/free-exercise-db   (fuera del repo)
//   2. npm i --no-save sharp
//   3. SRC=/ruta/a/free-exercise-db node tools/build-catalog.mjs
//
// Produce:
//   public/exercises/<id>.webp   — una foto por ejercicio, 360 px, WebP q68
//   src/data/catalog.json        — array recortado + traducción al español
//
// Traducción: tools/translations-es.json  ->  { "<id>": { "nameEs", "instructionsEs": [...] } }
// Si falta la clave de un ejercicio, cae al inglés y se cuenta en el resumen.

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC =
  process.env.SRC ||
  join(
    process.env.TEMP || "/tmp",
    "claude/c--Users-perez-Desktop-Code-GymTracker/ccbf9c54-358d-4746-a97c-192f9ed78175/scratchpad/free-exercise-db",
  );

const OUT_IMG = join(ROOT, "public", "exercises");
const OUT_JSON = join(ROOT, "src", "data", "catalog.json");
const TRANSLATIONS = join(ROOT, "tools", "translations-es.json");

const MUSCLES = new Set([
  "abdominals","abductors","adductors","biceps","calves","chest","forearms","glutes",
  "hamstrings","lats","lower back","middle back","neck","quadriceps","shoulders","traps","triceps",
]);
const EQUIPMENT = new Set([
  "body only","bands","barbell","cable","dumbbell","e-z curl bar","exercise ball","foam roll",
  "kettlebells","machine","medicine ball","other",
]);
const CATEGORIES = new Set([
  "strength","stretching","plyometrics","powerlifting","olympic weightlifting","strongman","cardio",
]);
const LEVELS = new Set(["beginner","intermediate","expert"]);
const FORCES = new Set(["push","pull","static"]);
const MECHANICS = new Set(["compound","isolation"]);

const pick = (v, set) => (set.has(v) ? v : null);

if (!existsSync(join(SRC, "dist", "exercises.json"))) {
  console.error(`No encuentro free-exercise-db en ${SRC}. Clónalo o pasa SRC=...`);
  process.exit(1);
}

const raw = JSON.parse(readFileSync(join(SRC, "dist", "exercises.json"), "utf8"));
const tr = existsSync(TRANSLATIONS)
  ? JSON.parse(readFileSync(TRANSLATIONS, "utf8"))
  : {};

mkdirSync(OUT_IMG, { recursive: true });

let imgCount = 0;
let imgBytes = 0;
let missingName = 0;
let missingInstr = 0;

async function convert(ex) {
  const rel = ex.images?.[0];
  if (!rel) return false;
  const src = join(SRC, "exercises", rel);
  if (!existsSync(src)) return false;
  const dest = join(OUT_IMG, `${ex.id}.webp`);
  await sharp(src)
    .resize({ width: 360, withoutEnlargement: true })
    .webp({ quality: 68, effort: 6 })
    .toFile(dest);
  imgCount++;
  imgBytes += statSync(dest).size;
  return true;
}

async function run() {
  const catalog = [];
  const BATCH = 16;
  for (let i = 0; i < raw.length; i += BATCH) {
    const slice = raw.slice(i, i + BATCH);
    const hasImageFlags = await Promise.all(slice.map(convert));
    slice.forEach((ex, j) => {
      const t = tr[ex.id];
      const nameEs = t?.nameEs || ex.name;
      const instructionsEs =
        t?.instructionsEs && t.instructionsEs.length
          ? t.instructionsEs
          : ex.instructions;
      if (!t?.nameEs) missingName++;
      if (!t?.instructionsEs?.length) missingInstr++;
      catalog.push({
        id: ex.id,
        name: ex.name,
        nameEs,
        primaryMuscles: (ex.primaryMuscles || []).filter((m) => MUSCLES.has(m)),
        secondaryMuscles: (ex.secondaryMuscles || []).filter((m) => MUSCLES.has(m)),
        equipment: pick(ex.equipment, EQUIPMENT),
        category: pick(ex.category, CATEGORIES) || "strength",
        level: pick(ex.level, LEVELS) || "intermediate",
        mechanic: pick(ex.mechanic, MECHANICS),
        force: pick(ex.force, FORCES),
        instructionsEs: (instructionsEs || []).map((s) => s.trim()).filter(Boolean),
        hasImage: hasImageFlags[j],
      });
    });
    process.stdout.write(`\r  ${Math.min(i + BATCH, raw.length)}/${raw.length}`);
  }
  process.stdout.write("\n");

  catalog.sort((a, b) => a.nameEs.localeCompare(b.nameEs, "es"));
  writeFileSync(OUT_JSON, JSON.stringify(catalog));

  const jsonBytes = statSync(OUT_JSON).size;
  console.log(`\nEjercicios:        ${catalog.length}`);
  console.log(`Fotos escritas:    ${imgCount}  (${(imgBytes / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`catalog.json:      ${(jsonBytes / 1024).toFixed(0)} KB`);
  console.log(`Sin nombre ES:     ${missingName}`);
  console.log(`Sin instrucc. ES:  ${missingInstr}`);
}

run();
