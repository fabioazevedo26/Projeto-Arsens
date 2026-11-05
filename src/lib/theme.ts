// Modo claro/escuro: a classe "dark" no <html> liga as variantes dark: do Tailwind.
import { useSyncExternalStore } from "react";
import { THEME_COLOR, THEME_STORAGE_KEY } from "./theme-key";

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

// Faz a barra do navegador/sistema (meta theme-color) acompanhar o tema real do site
export function applyThemeColor(dark: boolean) {
  const color = dark ? THEME_COLOR.dark : THEME_COLOR.light;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", color));
}

export function setTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  applyThemeColor(dark);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // navegação privada / armazenamento bloqueado: o tema vale só para esta visita
  }
}
