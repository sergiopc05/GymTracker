import type { ReactNode } from "react";
import type { Exercise } from "../types";
import { RUN_MODALITIES } from "../types";
import type { ExercisePatch } from "../store";
import { RUN_MODALITY_LABEL } from "../lib/format";

interface Props {
  exercise: Exercise;
  index: number;
  count: number;
  onPatch: (patch: ExercisePatch) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}

function numOrU(s: string): number | undefined {
  const t = s.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="f">
      <span className="f__label">{label}</span>
      {children}
    </label>
  );
}

export function ExerciseEditor({
  exercise,
  index,
  count,
  onPatch,
  onMove,
  onDelete,
}: Props) {
  const ex = exercise;

  return (
    <li className="exed">
      <div className="exed__bar">
        <span className="exed__idx">{String(index + 1).padStart(2, "0")}</span>
        <div className="exed__actions">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Subir">
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === count - 1}
            aria-label="Bajar"
          >
            ↓
          </button>
          <button type="button" className="danger" onClick={onDelete} aria-label="Borrar">
            ✕
          </button>
        </div>
      </div>

      <div className="exed__fields">
        {ex.kind === "strength" && (
          <>
            <Field label="ejercicio">
              <input
                type="text"
                value={ex.name}
                placeholder="sentadilla"
                onChange={(e) => onPatch({ name: e.target.value })}
              />
            </Field>
            <div className="frow">
              <Field label="series">
                <input
                  type="number"
                  min="1"
                  value={ex.sets}
                  onChange={(e) => onPatch({ sets: Math.max(1, Number(e.target.value) || 1) })}
                />
              </Field>
              <Field label="reps">
                <input
                  type="text"
                  value={ex.reps}
                  placeholder="8-10"
                  onChange={(e) => onPatch({ reps: e.target.value })}
                />
              </Field>
            </div>
            <div className="frow">
              <Field label="peso kg">
                <input
                  type="number"
                  inputMode="decimal"
                  value={ex.weightKg ?? ""}
                  onChange={(e) => onPatch({ weightKg: numOrU(e.target.value) })}
                />
              </Field>
              <Field label="descanso s">
                <input
                  type="number"
                  inputMode="numeric"
                  value={ex.restSec ?? ""}
                  onChange={(e) => onPatch({ restSec: numOrU(e.target.value) })}
                />
              </Field>
            </div>
          </>
        )}

        {ex.kind === "run" && (
          <>
            <div className="frow">
              <Field label="modalidad">
                <select
                  value={ex.modality}
                  onChange={(e) =>
                    onPatch({ modality: e.target.value as (typeof RUN_MODALITIES)[number] })
                  }
                >
                  {RUN_MODALITIES.map((m) => (
                    <option key={m} value={m}>
                      {RUN_MODALITY_LABEL[m]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="series">
                <input
                  type="number"
                  min="1"
                  value={ex.sets}
                  onChange={(e) => onPatch({ sets: Math.max(1, Number(e.target.value) || 1) })}
                />
              </Field>
            </div>
            {ex.modality === "fartlek" ? (
              <div className="frow">
                <Field label="carrera min">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={ex.effortMin ?? ""}
                    onChange={(e) => onPatch({ effortMin: numOrU(e.target.value) })}
                  />
                </Field>
                <Field label="trote min">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={ex.recoveryMin ?? ""}
                    onChange={(e) => onPatch({ recoveryMin: numOrU(e.target.value) })}
                  />
                </Field>
              </div>
            ) : (
              <div className="frow">
                {ex.modality !== "andar" && (
                  <Field label="distancia m">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={ex.distanceM ?? ""}
                      onChange={(e) => onPatch({ distanceM: numOrU(e.target.value) })}
                    />
                  </Field>
                )}
                <Field label="duración min">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={ex.durationMin ?? ""}
                    onChange={(e) => onPatch({ durationMin: numOrU(e.target.value) })}
                  />
                </Field>
                {ex.sets > 1 && (
                  <Field label="descanso s">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={ex.restSec ?? ""}
                      onChange={(e) => onPatch({ restSec: numOrU(e.target.value) })}
                    />
                  </Field>
                )}
              </div>
            )}
            <Field label="nota">
              <input
                type="text"
                value={ex.note ?? ""}
                placeholder="calentamiento, cuestas, progresivo…"
                onChange={(e) => onPatch({ note: e.target.value || undefined })}
              />
            </Field>
          </>
        )}

        {ex.kind === "swim" && (
          <>
            <Field label="ejercicio">
              <input
                type="text"
                value={ex.name ?? ""}
                placeholder="crol, técnica, pull…"
                onChange={(e) => onPatch({ name: e.target.value })}
              />
            </Field>
            <div className="frow">
              <Field label="series">
                <input
                  type="number"
                  min="1"
                  value={ex.sets}
                  onChange={(e) => onPatch({ sets: Math.max(1, Number(e.target.value) || 1) })}
                />
              </Field>
              <Field label="distancia m">
                <input
                  type="number"
                  inputMode="numeric"
                  value={ex.distanceM}
                  onChange={(e) => onPatch({ distanceM: numOrU(e.target.value) ?? 0 })}
                />
              </Field>
            </div>
            <div className="frow">
              <Field label="descanso s">
                <input
                  type="number"
                  inputMode="numeric"
                  value={ex.restSec ?? ""}
                  onChange={(e) => onPatch({ restSec: numOrU(e.target.value) })}
                />
              </Field>
              <Field label="tiempo/serie s">
                <input
                  type="number"
                  inputMode="numeric"
                  value={ex.durationSec ?? ""}
                  onChange={(e) => onPatch({ durationSec: numOrU(e.target.value) })}
                />
              </Field>
            </div>
          </>
        )}
      </div>
    </li>
  );
}
