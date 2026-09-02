import { useRef, useState } from "react";
import { useStore } from "../store";
import { isoDate } from "../lib/dates";

const APP_VERSION = "1.0.0";

export function SettingsScreen() {
  const { store, exportJson, importJson, clearAll } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pasted, setPasted] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const dayCount = Object.keys(store.logs).length;

  function downloadBackup() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gymtracker-backup-${isoDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyBackup() {
    try {
      await navigator.clipboard.writeText(exportJson());
      setMsg({ kind: "ok", text: "Copiado al portapapeles." });
    } catch {
      setMsg({ kind: "err", text: "No se pudo copiar. Usa «Descargar»." });
    }
  }

  function runImport(text: string) {
    const result = importJson(text);
    if (result.ok) {
      setMsg({ kind: "ok", text: "Datos importados correctamente." });
      setPasted("");
    } else {
      setMsg({ kind: "err", text: result.error });
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => runImport(String(reader.result ?? ""));
    reader.onerror = () => setMsg({ kind: "err", text: "No se pudo leer el archivo." });
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="screen">
      <h2 className="screen__title">Ajustes</h2>

      <section className="editcard">
        <h3 className="group__title">Copia de seguridad</h3>
        <p className="muted">
          Los datos se guardan solo en este dispositivo. Exporta de vez en cuando para no
          perderlos si borras el historial de Safari.
        </p>
        <div className="btn-stack">
          <button type="button" className="ghostbtn" onClick={downloadBackup}>
            Descargar copia (.json)
          </button>
          <button type="button" className="ghostbtn" onClick={copyBackup}>
            Copiar copia al portapapeles
          </button>
        </div>
      </section>

      <section className="editcard">
        <h3 className="group__title">Importar</h3>
        <div className="btn-stack">
          <button
            type="button"
            className="ghostbtn"
            onClick={() => fileRef.current?.click()}
          >
            Elegir archivo .json
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={onFile}
          />
          <textarea
            className="jsonbox"
            placeholder="…o pega aquí el contenido de la copia"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={4}
          />
          <button
            type="button"
            className="ghostbtn"
            disabled={!pasted.trim()}
            onClick={() => {
              if (confirm("¿Importar estos datos? Sustituirá tu rutina y tu historial."))
                runImport(pasted);
            }}
          >
            Importar texto pegado
          </button>
        </div>
      </section>

      {msg && (
        <p className={msg.kind === "ok" ? "flash flash--ok" : "flash flash--err"}>
          {msg.text}
        </p>
      )}

      <section className="editcard">
        <h3 className="group__title">Instalar en el iPhone</h3>
        <ol className="steps">
          <li>Abre esta página en Safari.</li>
          <li>
            Pulsa el botón <strong>Compartir</strong> (el cuadrado con la flecha hacia
            arriba).
          </li>
          <li>
            Elige <strong>Añadir a pantalla de inicio</strong>.
          </li>
          <li>
            Ábrela desde el icono nuevo. Ya funciona sin conexión: puedes activar el modo
            avión para comprobarlo.
          </li>
        </ol>
      </section>

      <section className="editcard">
        <h3 className="group__title">Datos</h3>
        <p className="muted">
          {dayCount === 0
            ? "Aún no has registrado ningún día."
            : `Tienes ${dayCount} día${dayCount === 1 ? "" : "s"} con registro.`}
        </p>
        <button
          type="button"
          className="ghostbtn danger"
          onClick={() => {
            if (
              confirm("¿Borrar la rutina y TODO el historial?") &&
              confirm("¿Seguro? Esta acción no se puede deshacer.")
            ) {
              clearAll();
              setMsg({ kind: "ok", text: "Todo borrado." });
            }
          }}
        >
          Borrar todos los datos
        </button>
      </section>

      <p className="version">GymTracker v{APP_VERSION} · funciona sin conexión</p>
    </div>
  );
}
