"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const AUTO_REFRESH_MS = 15_000;

// Auto-refresh invisível do painel público: re-renderiza o Server Component a cada 15 s,
// sem recarregar a página. Não renderiza nada na tela.
export default function PublicRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      // Evita requisições enquanto a aba está em segundo plano.
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, AUTO_REFRESH_MS);

    return () => clearInterval(id);
  }, [router]);

  return null;
}
