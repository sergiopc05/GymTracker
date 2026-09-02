# GymTracker

PWA para llevar el horario semanal de **gimnasio y running** e ir marcando los ejercicios
y carreras que vas completando cada día.

- **Funciona sin conexión.** Después de la primera carga no vuelve a necesitar internet
  (modo avión incluido). No hay servidor: todos los datos se guardan solo en tu dispositivo.
- **Instalable en el iPhone** desde Safari → _Añadir a pantalla de inicio_.
- Rutina **editable desde la app**: días, ejercicios y carreras.
- Seguimiento simple con **casillas** + barra de progreso y racha de días.

## Pantallas

| Pantalla    | Para qué                                                                  |
| ----------- | ------------------------------------------------------------------------- |
| **Hoy**     | Lo que toca hoy; marcas ejercicios/carreras. Flechas para ver otros días. |
| **Semana**  | Vista de los 7 días con lo planificado en cada uno.                      |
| **Editar**  | Defines el entreno de cada día: título, descanso, ejercicios, carreras.  |
| **Ajustes** | Copia de seguridad (exportar/importar), instalar, borrar datos.          |

## Desarrollo local

Requiere Node 18.17+ (probado con 18.17.1).

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

Los datos viven en `localStorage`. Si borras los datos de sitios web de Safari, se pierden.
En **Ajustes** puedes descargar/copiar un `.json` con toda tu rutina e historial, y volver a
importarlo.

## Estructura

```
scripts/generate-icons.mjs   Genera los PNG del icono sin dependencias (node:zlib)
src/
  types.ts                   Modelo de datos
  store.tsx                  Estado global + persistencia en localStorage
  defaultRoutine.ts          Rutina vacía + rutina de ejemplo
  lib/dates.ts               Utilidades de fecha
  lib/progress.ts            Cálculo de progreso y racha
  components/                TabBar, CheckRow, ProgressBar
  screens/                   TodayScreen, WeekScreen, EditScreen, SettingsScreen
```

## Nota técnica

`package.json` fija `overrides.workbox-build = 7.1.0` porque las versiones más nuevas de
`workbox-build` (que arrastra `vite-plugin-pwa`) requieren Node 20+. Con Node 20 puedes
quitar ese override si quieres.
