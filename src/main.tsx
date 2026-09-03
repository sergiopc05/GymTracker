import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./styles.css";

// PWA: al detectar una versión nueva, actívala y recarga la página sola.
registerSW({ immediate: true });

const root = document.getElementById("root");
if (!root) throw new Error("Falta #root en index.html");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
