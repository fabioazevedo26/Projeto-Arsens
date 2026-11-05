"use client";

import { useEffect } from "react";

// Registra o service worker (public/sw.js) somente no build de produção: em desenvolvimento
// ele atrapalharia o recarregamento automático do Next.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    // updateViaCache "none": o navegador sempre confere se há uma versão nova do sw.js
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch((error) => {
      console.error("Falha ao registrar o service worker:", error);
    });
  }, []);

  return null;
}
