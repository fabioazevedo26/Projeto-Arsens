import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

interface MobileCollapsibleProps {
  title: string;
  eyebrow?: string;
  icon: IconName;
  children: ReactNode;
}

// Seção que abre e fecha com um toque, SÓ no celular (some a partir de 768 px, onde a versão
// completa da página continua sempre visível). Usa o <details> nativo: funciona sem JavaScript,
// é acessível para leitores de tela e o conteúdo fechado (ex.: o mapa) nem é carregado.
export default function MobileCollapsible({ title, eyebrow, icon, children }: MobileCollapsibleProps) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white shadow-card md:hidden dark:border-slate-800 dark:bg-slate-900">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-2xl p-4 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/20 [&::-webkit-details-marker]:hidden">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-brand-strong dark:bg-teal-500/10 dark:text-teal-300">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          {eyebrow && (
            <span className="block text-[11px] font-bold tracking-[0.08em] text-brand-strong uppercase dark:text-teal-300">
              {eyebrow}
            </span>
          )}
          <span className="block font-bold text-slate-900 dark:text-slate-50">{title}</span>
        </span>
        <Icon
          name="chevronDown"
          className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180 dark:text-slate-400"
        />
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}
