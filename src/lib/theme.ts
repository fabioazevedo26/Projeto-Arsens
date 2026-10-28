// Modo claro/escuro: a classe "dark" no <html> liga as variantes dark: do Tailwind.
import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "./theme-key";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const isDarkNow = () => document.documentElement.classList.contains("dark");

// Para Client Components que precisam do tema em JavaScript (ex.: cores do gráfico do Recharts).
// No servidor assume claro; na hidratação, o React atualiza para o tema real.
export function useIsDark(): boolean {
  return useSyncExternalStore(subscribe, isDarkNow, () => false);
}

export function setTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // navegação privada / armazenamento bloqueado: o tema vale só para esta visita
  }
}
