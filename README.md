# GymTracker

PWA con estética de terminal para llevar tu semana de entrenamiento e ir marcando cada
serie que completas.

- **Plantillas reutilizables** con nombre, que asignas a cada día de la semana.
- **5 tipos de día**: gym, running, core, natación y descanso (uno por día). El de descanso
  puede ir vacío o llevar una caminata opcional que marcar.
- **Ejercicios con detalle según el tipo**:
  - _gym / core_: series, peso, descanso, y cada serie por **repeticiones o por tiempo**.
  - _running_: modalidad (andar / trotar / fartlek / carrera), distancia, tiempo, intervalos.
    En _andar_ eliges medir por tiempo o por distancia.
  - _natación_: series × distancia, descanso, tiempo por serie.
- **Registro por serie**: marcas cada `[ ]` → `[x]`; el ejercicio se cierra al completarlas.
  Si la plantilla no tiene ejercicios, marcas el día entero como hecho con un botón.
- **El pasado no se reescribe**: en cuanto marcas algo en un día, ese día queda fijado.
  Después puedes editar la plantilla libremente — solo cambia en los días aún sin marcar.
- **Editar un solo día**: desde «hoy» puedes ajustar los ejercicios de una fecha concreta
  (añadir, quitar, cambiar pesos…) sin tocar la plantilla, y volver a ella cuando quieras.
- **Funciona sin conexión.** Tras la primera carga no vuelve a necesitar internet (modo
  avión incluido). No hay servidor: los datos se guardan solo en tu dispositivo.
- **Instalable en el iPhone** desde Safari → _Añadir a pantalla de inicio_.

## Pantallas

| Pantalla        | Para qué                                                                     |
| --------------- | -------------------------------------------------------------------------- |
| **hoy**         | El entreno del día; marcas serie a serie. Flechas para otros días. Puedes cambiar o cancelar el entreno de una fecha, o editar sus ejercicios solo para ese día, sin tocar la semana ni la plantilla. |
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
npm run build     # genera dist/ (service worker incluido)
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
public/                      Iconos PWA (favicon, pwa-*, apple-touch-icon)
src/
  types.ts                   Modelo de datos (plantillas, tipos de día, ejercicios)
  store.tsx                  Estado global + persistencia en localStorage
  defaultData.ts             Store vacío + rutina de ejemplo
  lib/dates.ts               Utilidades de fecha
  lib/progress.ts            Plan efectivo del día, progreso por serie, racha
  lib/format.ts              Formateo de fichas de ejercicio (4×8 · 60 kg · r90")
  components/                TabBar, SetBoxes, AsciiBar, ExerciseEditor, EmojiPicker
  screens/                   TodayScreen, CalendarScreen, WeekScreen, TemplatesScreen, SettingsScreen
```

## Stack

Vite 8 · React 18 · TypeScript · vite-plugin-pwa 1.3 (Workbox). Sin dependencias en runtime
más allá de React. Los iconos son PNG estáticos en `public/`.
