"use client";

import { useIsOnline } from "@/lib/network";
import Icon from "../Icon";

// Aviso global quando o APARELHO fica sem internet. É diferente do selo "Sem sinal" do
// cabeçalho, que indica que o ESP32 parou de enviar leituras.
export default function NetworkStatus() {
  const isOnline = useIsOnline();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]"
    >
      <p className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-raised dark:bg-slate-100 dark:text-slate-900">
        <Icon name="cloudOff" className="h-5 w-5 shrink-0" />
        Você está sem internet. As leituras podem estar desatualizadas.
      </p>
    </div>
  );
}
