"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import Icon from "./Icon";

const AUTO_REFRESH_MS = 15_000;
// Intervalo mínimo entre duas atualizações automáticas: "voltou para o app" e "voltou a
// internet" costumam acontecer juntos, e o timer pode bater logo em seguida.
const MIN_GAP_MS = 3_000;

interface RefreshButtonProps {
  variant?: "primary" | "onDark"; // onDark: sobre a faixa escura do painel técnico
}

export default function RefreshButton({ variant = "primary" }: RefreshButtonProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const lastRefreshAt = useRef(0);

  // Auto-refresh silencioso: re-renderiza o Server Component sem recarregar a página.
  useEffect(() => {
    const refresh = () => {
      // Só com a aba visível e com internet. Sem internet, o refresh falharia e o Next
      // recarregaria a página inteira (que cairia na tela offline); o aviso global já
      // informa que as leituras podem estar desatualizadas.
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      const now = Date.now();
      if (now - lastRefreshAt.current < MIN_GAP_MS) return; // evita atualizações duplicadas
      lastRefreshAt.current = now;
      router.refresh();
    };

    // Ao voltar para o app (ex.: desbloqueou o celular), atualiza na hora
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    const id = setInterval(refresh, AUTO_REFRESH_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", refresh); // a conexão voltou

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", refresh);
    };
  }, [router]);

  const handleRefresh = () => {
    if (!navigator.onLine) return; // sem internet não há como buscar leituras novas
    lastRefreshAt.current = Date.now();
    startTransition(() => {
      router.refresh();
    });
  };

  const style =
    variant === "onDark"
      ? "bg-teal-500 text-slate-950 hover:bg-teal-400"
      : "bg-brand text-white hover:bg-brand-strong";

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      title="Atualiza automaticamente a cada 15 s"
      aria-label="Atualizar dados"
      className={`inline-flex h-12 items-center gap-2 rounded-2xl px-4 text-sm font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 ${style}`}
    >
      <Icon name="refresh" className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
      <span>{isRefreshing ? "Atualizando..." : "Atualizar"}</span>
    </button>
  );
}
