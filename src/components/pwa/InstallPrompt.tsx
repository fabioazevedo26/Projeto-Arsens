"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useIsOnline } from "@/lib/network";
import Icon from "../Icon";

const DISMISS_KEY = "arsens-install-dismissed";

// Evento de instalação do Chrome/Android (ainda não está nos tipos padrão do TypeScript)
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Env = "server" | "installed" | "dismissed" | "ios" | "other";

function readEnv(): Env {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  try {
    if (localStorage.getItem(DISMISS_KEY)) return "dismissed";
  } catch {
    // armazenamento bloqueado: segue mostrando o aviso
  }
  // iPadOS se apresenta como "MacIntel", mas tem tela de toque
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return isIOS ? "ios" : "other";
}

const noopSubscribe = () => () => {};

// Aviso discreto e dispensável para instalar o ARSENS na tela inicial.
// Android e navegadores compatíveis: botão "Instalar" (beforeinstallprompt).
// iPhone/iPad: passo a passo Compartilhar > Adicionar à Tela de Início.
// Não aparece se o app já estiver instalado, se o aviso foi dispensado ou sem internet.
export default function InstallPrompt() {
  const env = useSyncExternalStore(noopSubscribe, readEnv, (): Env => "server");
  const isOnline = useIsOnline();
  const [canPrompt, setCanPrompt] = useState(false);
  const [hidden, setHidden] = useState(false);
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault(); // guarda o evento para usar no botão "Instalar"
      deferred.current = event as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };
    const onInstalled = () => {
      deferred.current = null;
      setHidden(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // armazenamento bloqueado: some só nesta visita
    }
  };

  const install = async () => {
    const event = deferred.current;
    if (!event) return;
    deferred.current = null;
    await event.prompt();
    await event.userChoice;
    setHidden(true); // o navegador só permite pedir uma vez por evento
  };

  const isIOS = env === "ios";
  if (hidden || !isOnline || env === "server" || env === "installed" || env === "dismissed") return null;
  if (!isIOS && !canPrompt) return null;

  return (
    <aside
      aria-label="Instalar o ARSENS"
      className="fixed inset-x-0 bottom-0 z-40 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:left-auto sm:max-w-sm"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-raised dark:border-slate-800 dark:bg-slate-900">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-brand-strong dark:bg-teal-500/10 dark:text-teal-300">
          <Icon name="smartphone" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 dark:text-slate-50">Instale o ARSENS</p>
          {isIOS ? (
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Toque em <strong className="inline-flex items-center gap-1 text-slate-800 dark:text-slate-200">
                Compartilhar <Icon name="share" className="h-4 w-4" />
              </strong>{" "}
              e depois em <strong className="text-slate-800 dark:text-slate-200">Adicionar à Tela de Início</strong>.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Acesse a qualidade do ar direto da tela inicial do seu celular.
              </p>
              <button
                type="button"
                onClick={install}
                className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong"
              >
                <Icon name="download" className="h-4 w-4" />
                Instalar
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dispensar aviso de instalação"
          className="-mt-2 -mr-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Icon name="close" className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}
