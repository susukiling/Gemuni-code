import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "highlight.js/styles/github-dark.css";
import "./styles.css";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

// ホーム画面に追加(PWAインストール)の条件を満たすためのService Worker
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
