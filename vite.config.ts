import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages sirve el proyecto en https://<usuario>.github.io/<repo>/
// El workflow de deploy pone GH_PAGES_BASE="/<repo>/" automaticamente.
// Si publicas en la raiz de un dominio (Netlify, dominio propio) usa "/".
const base = process.env.GH_PAGES_BASE || "/GymTracker/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "GymTracker",
        short_name: "Gym",
        description: "Horario semanal de gimnasio y running, offline.",
        lang: "es",
        start_url: ".",
        scope: ".",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0f1115",
        theme_color: "#0f1115",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // App puramente local: no hay rutas de red que cachear en runtime.
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        // Permite probar el service worker con `npm run dev`.
        enabled: false,
      },
    }),
  ],
});
