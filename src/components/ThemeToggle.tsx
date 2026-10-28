"use client";

import { setTheme, useIsDark } from "@/lib/theme";
import Icon from "./Icon";

// Alterna entre modo claro e escuro. O ícone muda só por CSS (dark:), então aparece certo
// já no primeiro desenho da página, sem esperar o JavaScript.
export default function ThemeToggle() {
  const isDark = useIsDark();

  return (
    <button
      type="button"
      onClick={() => setTheme(!isDark)}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-slate-800"
    >
      <Icon name="moon" className="h-5 w-5 dark:hidden" />
      <Icon name="sun" className="hidden h-5 w-5 dark:block" />
    </button>
  );
}
