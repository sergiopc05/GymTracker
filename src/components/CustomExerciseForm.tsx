import { useRef, useState } from "react";
import { STORAGE_LIMIT, storeBytes, useStore } from "../store";
import type { CustomExercise } from "../types";
import {
  EQUIPMENT,
  EQUIPMENT_ES,
  MUSCLES,
  MUSCLE_ES,
  type Equipment,
  type Muscle,
} from "../lib/catalogVocab";
import { resizeImage } from "../lib/resizeImage";
import { ExercisePhoto } from "./ExercisePhoto";

interface Props {
  /** Si viene, es edición. */
  initial?: CustomExercise;
  onDone: () => void;
}

export function CustomExerciseForm({ initial, onDone }: Props) {
  const { store, addCustomExercise, updateCustomExercise } = useStore();

  const [name, setName] = useState(initial?.nameEs ?? "");
  const [muscles, setMuscles] = useState<Muscle[]>(initial?.primaryMuscles ?? []);
  const [equip, setEquip] = useState<Equipment | "">(initial?.equipment ?? "");
  const [instr, setInstr] = useState((initial?.instructions ?? []).join("\n"));
  const [photo, setPhoto] = useState<string | undefined>(initial?.photo);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleMuscle(m: Muscle) {
    setMuscles((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const url = await resizeImage(file);
      const base = storeBytes(store) - (photo?.length ?? 0);
      if (base + url.length * 1.1 > STORAGE_LIMIT) {
        setErr("almacenamiento casi lleno — la foto no se guardó");
      } else {
        setPhoto(url);
      }
    } catch {
      setErr("no se pudo procesar la foto");
    } finally {
      setBusy(false);
    }
  }

  function save() {
    const nameEs = name.trim();
    if (!nameEs) {
      setErr("ponle un nombre");
      return;
    }
    const data = {
      nameEs,
      primaryMuscles: muscles,
      equipment: equip || null,
      instructions: instr
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      photo,
    };
    try {
      if (initial) updateCustomExercise(initial.id, data);
      else addCustomExercise(data);
      onDone();
    } catch {
      setErr("no se pudo guardar (almacenamiento lleno)");
    }
  }

  return (
    <div className="screen">
      <button type="button" className="linkbtn" onClick={onDone}>
        &larr; biblioteca
      </button>
      <h2 className="rule">{initial ? "editar ejercicio" : "nuevo ejercicio"}</h2>

      <section className="card">
        <label className="f">
          <span className="f__label">nombre</span>
          <input
            type="text"
            autoFocus
            value={name}
            placeholder="sentadilla búlgara…"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="f">
          <span className="f__label">músculos</span>
          <div className="chiprow">
            {MUSCLES.map((m) => (
              <button
                key={m}
                type="button"
                className={muscles.includes(m) ? "chip is-sel" : "chip"}
                onClick={() => toggleMuscle(m)}
              >
                {MUSCLE_ES[m]}
              </button>
            ))}
          </div>
        </div>

        <label className="f">
          <span className="f__label">material</span>
          <select value={equip} onChange={(e) => setEquip(e.target.value as Equipment | "")}>
            <option value="">— ninguno —</option>
            {EQUIPMENT.map((eq) => (
              <option key={eq} value={eq}>
                {EQUIPMENT_ES[eq]}
              </option>
            ))}
          </select>
        </label>

        <div className="f">
          <span className="f__label">foto</span>
          {photo && <ExercisePhoto className="libphoto" src={photo} alt={name} />}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={onFile}
          />
          <div className="btn-stack">
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? "procesando…" : photo ? "[ cambiar foto ]" : "[ hacer / elegir foto ]"}
            </button>
            {photo && (
              <button type="button" className="btn" onClick={() => setPhoto(undefined)}>
                [ quitar foto ]
              </button>
            )}
          </div>
        </div>

        <label className="f">
          <span className="f__label">instrucciones (una por línea)</span>
          <textarea
            className="jsonbox"
            rows={4}
            value={instr}
            onChange={(e) => setInstr(e.target.value)}
          />
        </label>

        {err && <p className="flash flash--err">! {err}</p>}

        <div className="frow">
          <button type="button" className="btn" onClick={save}>
            [ {initial ? "guardar" : "crear"} ]
          </button>
          <button type="button" className="btn" onClick={onDone}>
            [ cancelar ]
          </button>
        </div>
      </section>
    </div>
  );
}
