"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

const AUTO_REFRESH_MS = 15_000;

export default function RefreshButton() {
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

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      title="Atualiza automaticamente a cada 15s"
      aria-label="Atualizar dados"
      className="text-sm px-3 py-2 flex items-center gap-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors disabled:opacity-50"
    >
      <svg
        className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      <span className="hidden md:inline">{isRefreshing ? "Atualizando..." : "Atualizar"}</span>
    </button>
  );
}
