# GymTracker

PWA con estética de terminal para llevar tu semana de entrenamiento e ir marcando cada
serie que completas.

- **Plantillas reutilizables** con nombre, que asignas a cada día de la semana.
- **5 tipos de día**: gym, running, core, natación y descanso (uno por día). El de descanso
  puede ir vacío o llevar una caminata opcional que marcar.
- **Ejercicios con detalle según el tipo**:
  - _gym / core_: series, repeticiones, peso, descanso entre series.
  - _running_: modalidad (andar / trotar / fartlek / carrera), distancia, tiempo, intervalos.
  - _natación_: series × distancia, descanso, tiempo por serie.
- **Registro por serie**: marcas cada `[ ]` → `[x]`; el ejercicio se cierra al completarlas.
- **Funciona sin conexión.** Tras la primera carga no vuelve a necesitar internet (modo
  avión incluido). No hay servidor: los datos se guardan solo en tu dispositivo.
- **Instalable en el iPhone** desde Safari → _Añadir a pantalla de inicio_.

## Pantallas

| Pantalla        | Para qué                                                                     |
| --------------- | -------------------------------------------------------------------------- |
| **hoy**         | El entreno del día; marcas serie a serie. Flechas para otros días. Puedes cambiar o cancelar el entreno de una fecha concreta sin tocar la semana. |
| **mes**         | Calendario mensual: color y emoji por tipo, fondo lleno = día hecho, `×` = sin hacer. Toca un día para abrirlo. |
| **semana**      | Los 7 días con su plantilla; asignar plantilla o abrir su editor.           |
| **plantillas**  | Biblioteca: crear/editar plantillas (emoji, nombre, tipo, ejercicios).      |
| **ajustes**     | Rutina de ejemplo, copia de seguridad (exportar/importar), instalar, borrar. |

## Desarrollo local

Requiere **Node 22 LTS** (mínimo 20.19; Vite 8 no funciona en Node 18).
En Windows: `winget install OpenJS.NodeJS.LTS` o descárgalo de <https://nodejs.org>.

```bash
npm install
npm run dev       # http://localhost:5173/GymTracker/
```

Otros comandos:

```bash
npm run build     # genera dist/ (incluye iconos + service worker)
npm run preview    # sirve dist/ en local para probar el modo offline real
npm run typecheck
```

## Publicar en GitHub Pages (uso único de internet)

La app es offline, pero iOS necesita cargarla **una vez** desde una URL HTTPS para poder
instalarla con soporte offline. GitHub Pages sirve para eso y es gratis.

1. Crea un repositorio vacío en GitHub llamado **`GymTracker`** (si usas otro nombre, no
   pasa nada: el workflow ajusta la ruta automáticamente).
2. Sube este proyecto:
   ```bash
   git remote add origin https://github.com/<tu-usuario>/GymTracker.git
   git push -u origin main
   ```
3. En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Cada `git push` a `main` recompila y publica en
   `https://<tu-usuario>.github.io/GymTracker/`.

Cuando ya la tengas instalada en el móvil puedes incluso poner el repo en privado o borrar
Pages: la app seguirá funcionando en el teléfono.

### Alternativa sin git: Netlify Drop

```bash
npm run build
```

Arrastra la carpeta `dist/` a <https://app.netlify.com/drop>. Si publicas en la raíz de un
dominio (no en un subdirectorio), compila con `GH_PAGES_BASE=/ npm run build`.

## Instalar en el iPhone

1. Abre la URL publicada en **Safari** (no en Chrome).
2. Botón **Compartir** → **Añadir a pantalla de inicio**.
3. Abre la app desde el icono nuevo. Activa el modo avión para comprobar que funciona sin
   conexión.

## Copia de seguridad

Los datos viven en `localStorage` (clave `gymtracker:v2`). Si borras los datos de sitios web
de Safari, se pierden. En **ajustes** puedes descargar/copiar un `.json` con plantillas,
semana e historial, y volver a importarlo.

## Estructura

```
scripts/generate-icons.mjs   Genera los PNG del icono sin dependencias (node:zlib)
src/
  types.ts                   Modelo de datos (plantillas, tipos de día, ejercicios)
  store.tsx                  Estado global + persistencia en localStorage
  defaultData.ts             Store vacío + rutina de ejemplo
  lib/dates.ts               Utilidades de fecha
  lib/progress.ts            Progreso por serie, racha, resolución del día
  lib/format.ts              Formateo de fichas de ejercicio (4×8 · 60 kg · r90")
  components/                TabBar, SetBoxes, AsciiBar, ExerciseEditor, EmojiPicker
  screens/                   TodayScreen, CalendarScreen, WeekScreen, TemplatesScreen, SettingsScreen
```

## Stack

Vite 8 · React 18 · TypeScript · vite-plugin-pwa 1.3 (Workbox). Sin dependencias en runtime
más allá de React. Los iconos se generan en `prebuild`/`predev` con un script propio
(`node:zlib`, cero dependencias).
