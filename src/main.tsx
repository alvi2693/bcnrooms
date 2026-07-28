import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Registrar el Service Worker (necesario para notificaciones push y modo app)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("SW registrado:", reg.scope))
      .catch((err) => console.error("Error registrando SW:", err));
  });
}