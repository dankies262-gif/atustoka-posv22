/// <reference types="vite-plugin-pwa/client" />
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { registerSW } from "virtual:pwa-register";

// Register Service Worker for PWA offline support
if ("serviceWorker" in navigator) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById("root")!).render(
  <AppWrapper>
    <App />
  </AppWrapper>
);
