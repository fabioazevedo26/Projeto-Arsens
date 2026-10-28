"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import Icon from "./Icon";

const AUTO_REFRESH_MS = 15_000;

interface RefreshButtonProps {
  variant?: "primary" | "onDark"; // onDark: sobre a faixa escura do painel técnico
}

export default function RefreshButton({ variant = "primary" }: RefreshButtonProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  // Auto-refresh silencioso: re-renderiza o Server Component sem recarregar a página.
  useEffect(() => {
    const id = setInterval(() => {
      // Evita requisições enquanto a aba está em segundo plano.
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, AUTO_REFRESH_MS);

    return () => clearInterval(id);
  }, [router]);

  const handleRefresh = () => {
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
