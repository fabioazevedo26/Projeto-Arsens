"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, useTransition } from "react";
import Icon from "./Icon";

const AUTO_REFRESH_MS = 15_000;
// Intervalo mínimo entre duas atualizações automáticas: "voltou para o app" e "voltou a
// internet" costumam acontecer juntos, e o timer pode bater logo em seguida.
const MIN_GAP_MS = 3_000;

// Compartilhado entre os botões da página (no celular há um segundo botão no card de status)
let lastRefreshAt = 0;

// Pausa da atualização automática (acessibilidade: quem lê devagar ou usa leitor de tela não
// perde o ponto da leitura). Fica na memória da aba: vale para todos os botões e continua
// ao navegar entre as páginas do site; ao recarregar a página, volta a atualizar sozinho.
let paused = false;
const pauseListeners = new Set<() => void>();
function setPaused(value: boolean) {
  paused = value;
  pauseListeners.forEach((listener) => listener());
}
function subscribePause(listener: () => void) {
  pauseListeners.add(listener);
  return () => {
    pauseListeners.delete(listener);
  };
}

interface RefreshButtonProps {
  variant?: "primary" | "onDark"; // onDark: sobre a faixa escura do painel técnico
  auto?: boolean; // liga o timer de 15 s; use false em botões extras para não duplicar o timer
}

export default function RefreshButton({ variant = "primary", auto = true }: RefreshButtonProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const isPaused = useSyncExternalStore(subscribePause, () => paused, () => false);

  // Auto-refresh silencioso: re-renderiza o Server Component sem recarregar a página.
  useEffect(() => {
    if (!auto) return;

    const refresh = () => {
      // Só com a aba visível e com internet. Sem internet, o refresh falharia e o Next
      // recarregaria a página inteira (que cairia na tela offline); o aviso global já
      // informa que as leituras podem estar desatualizadas.
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      if (paused) return; // pausada pelo usuário (o botão Atualizar continua funcionando)
      const now = Date.now();
      if (now - lastRefreshAt < MIN_GAP_MS) return; // evita atualizações duplicadas
      lastRefreshAt = now;
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
  }, [router, auto]);

  const handleRefresh = () => {
    if (!navigator.onLine) return; // sem internet não há como buscar leituras novas
    lastRefreshAt = Date.now();
    startTransition(() => {
      router.refresh();
    });
  };

  const style =
    variant === "onDark"
      ? "bg-teal-500 text-slate-950 hover:bg-teal-400"
      : "bg-brand text-white hover:bg-brand-strong";

  const pauseStyle =
    variant === "onDark"
      ? "bg-white/10 text-white hover:bg-white/20"
      : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isRefreshing}
        title={isPaused ? "Atualização automática pausada" : "Atualiza automaticamente a cada 15 s"}
        aria-label="Atualizar dados"
        className={`inline-flex h-12 items-center gap-2 rounded-2xl px-4 text-sm font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 ${style}`}
      >
        <Icon name="refresh" className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        <span>{isRefreshing ? "Atualizando..." : "Atualizar"}</span>
      </button>
      {/* Pausar/retomar a atualização automática (WCAG 2.2.2). O texto do botão diz o que ele
          FAZ ao ser tocado; por isso não usa aria-pressed (o leitor de tela diria "Retomar
          atualização, pressionado", o que confunde). */}
      <button
        type="button"
        onClick={() => setPaused(!isPaused)}
        title={isPaused ? "Voltar a atualizar sozinho a cada 15 s" : "Parar de atualizar sozinho enquanto você lê"}
        className={`inline-flex h-12 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-colors ${pauseStyle}`}
      >
        <Icon name={isPaused ? "play" : "pause"} className="h-4 w-4" />
        <span>{isPaused ? "Retomar atualização" : "Pausar atualização"}</span>
      </button>
    </div>
  );
}
