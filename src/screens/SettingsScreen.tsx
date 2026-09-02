import { useRef, useState } from "react";
import { useStore } from "../store";
import { isoDate } from "../lib/dates";

const APP_VERSION = "2.3.0";

export function SettingsScreen() {
  const { store, loadExample, exportJson, importJson, clearAll } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pasted, setPasted] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const dayCount = Object.keys(store.logs).length;
  const tplCount = store.templates.length;

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
      setMsg({ kind: "ok", text: "copiado al portapapeles" });
    } catch {
      setMsg({ kind: "err", text: "no se pudo copiar; usa «descargar»" });
    }
  }

  function runImport(text: string) {
    const result = importJson(text);
    if (result.ok) {
      setMsg({ kind: "ok", text: "datos importados" });
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
    reader.onerror = () => setMsg({ kind: "err", text: "no se pudo leer el archivo" });
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="screen">
      <h2 className="rule">ajustes</h2>

      <section className="card">
        <h3 className="rule rule--sm">rutina de ejemplo</h3>
        <p className="dim">
          Carga plantillas de los 4 tipos y una semana montada, para ver cómo funciona.
          Sustituye lo que tengas ahora.
        </p>
        <button
          type="button"
          className="btn"
          onClick={() => {
            if (confirm("¿Cargar la rutina de ejemplo? Sustituye plantillas y semana."))
              loadExample();
          }}
        >
          [ cargar ejemplo ]
        </button>
      </section>

      <section className="card">
        <h3 className="rule rule--sm">copia de seguridad</h3>
        <p className="dim">
          Todo se guarda solo en este dispositivo. Exporta de vez en cuando para no perder
          plantillas ni historial si borras los datos de Safari.
        </p>
        <div className="btn-stack">
          <button type="button" className="btn" onClick={downloadBackup}>
            [ descargar .json ]
          </button>
          <button type="button" className="btn" onClick={copyBackup}>
            [ copiar al portapapeles ]
          </button>
        </div>
      </section>

      <section className="card">
        <h3 className="rule rule--sm">importar</h3>
        <div className="btn-stack">
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            [ elegir archivo .json ]
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
            className="btn"
            disabled={!pasted.trim()}
            onClick={() => {
              if (confirm("¿Importar? Sustituye plantillas, semana e historial."))
                runImport(pasted);
            }}
          >
            [ importar texto pegado ]
          </button>
        </div>
      </section>

      {msg && (
        <p className={msg.kind === "ok" ? "flash flash--ok" : "flash flash--err"}>
          {msg.kind === "ok" ? "$ " : "! "}
          {msg.text}
        </p>
      )}

      <section className="card">
        <h3 className="rule rule--sm">instalar en el iPhone</h3>
        <ol className="steps">
          <li>abre esta página en Safari</li>
          <li>
            botón <strong>compartir</strong> (cuadrado con flecha arriba)
          </li>
          <li>
            <strong>añadir a pantalla de inicio</strong>
          </li>
          <li>ábrela desde el icono; ya funciona sin conexión (modo avión incluido)</li>
        </ol>
      </section>

      <section className="card">
        <h3 className="rule rule--sm">datos</h3>
        <p className="dim">
          {tplCount} plantilla{tplCount === 1 ? "" : "s"} · {dayCount} día
          {dayCount === 1 ? "" : "s"} con registro
        </p>
        <button
          type="button"
          className="btn danger"
          onClick={() => {
            if (
              confirm("¿Borrar plantillas, semana y TODO el historial?") &&
              confirm("¿Seguro? No se puede deshacer.")
            ) {
              clearAll();
              setMsg({ kind: "ok", text: "todo borrado" });
            }
          }}
        >
          [ borrar todos los datos ]
        </button>
      </section>

      <p className="version">gymtracker v{APP_VERSION} — offline</p>
    </div>
  );
}
