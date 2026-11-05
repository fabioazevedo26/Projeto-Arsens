// Estado da conexão do APARELHO com a internet (navigator.onLine + eventos online/offline).
// Não confundir com "Ao vivo" / "Sem sinal", que indicam se o ESP32 está enviando leituras.
import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

// No servidor assume "com internet"; no navegador, o React usa o valor real após hidratar.
export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}
