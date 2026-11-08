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

// iOS: "ios-safari" (Safari), "ios-browser" (Chrome, Edge, Firefox...) e "ios-inapp"
// (navegador embutido de Instagram, Facebook etc., onde não dá para adicionar à tela de início)
type Env = "server" | "installed" | "dismissed" | "ios-safari" | "ios-browser" | "ios-inapp" | "other";

const IN_APP_UA = /FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|Line\/|Twitter|TikTok|musical_ly|Snapchat|Pinterest|GSA\//;
const OTHER_BROWSER_UA = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|YaBrowser|DuckDuckGo/;

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
  if (!isIOS) return "other";
  const ua = navigator.userAgent;
  if (IN_APP_UA.test(ua)) return "ios-inapp";
  if (OTHER_BROWSER_UA.test(ua)) return "ios-browser";
  return "ios-safari";
}

const noopSubscribe = () => () => {};

// Aviso discreto e dispensável para instalar o ARSENS na tela inicial.
// Android e navegadores compatíveis: botão "Instalar" (beforeinstallprompt).
// iPhone/iPad: o iOS não deixa o site abrir a instalação, então mostramos o passo a passo
// usando o botão Compartilhar DO NAVEGADOR (o ícone aqui é só ilustração, não é clicável).
// Não aparece se o app já estiver instalado, se o aviso foi dispensado ou sem internet.
export default function InstallPrompt() {
  const env = useSyncExternalStore(noopSubscribe, readEnv, (): Env => "server");
  const isOnline = useIsOnline();
  const [canPrompt, setCanPrompt] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
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

  // No navegador embutido de outros apps não há "Adicionar à Tela de Início":
  // copiar o link facilita colar no Safari.
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied("ok");
    } catch {
      setCopied("fail"); // sem permissão: mostramos o link para copiar à mão
    }
  };

  const isIOS = env === "ios-safari" || env === "ios-browser" || env === "ios-inapp";
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
            <IosSteps env={env} copied={copied} onCopy={copyLink} />
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

// Selo que imita o botão do navegador. É <span> de propósito: não é clicável e não deve parecer.
function Badge({ icon, label }: { icon: "share" | "more" | "plusSquare"; label?: string }) {
  return (
    <span className="mx-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-slate-100 px-1.5 py-0.5 align-middle text-[0.8125rem] font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
      <Icon name={icon} className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
      {label && <span>{label}</span>}
    </span>
  );
}

function IosSteps({ env, copied, onCopy }: { env: Env; copied: "idle" | "ok" | "fail"; onCopy: () => void }) {
  const stepClass = "flex gap-2";
  const numClass =
    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-brand-strong dark:bg-teal-500/10 dark:text-teal-300";

  if (env === "ios-inapp") {
    return (
      <>
        <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Este navegador (dentro de outro app) não permite instalar. Abra o site no <strong>Safari</strong>: toque em{" "}
          <Badge icon="more" /> e em <strong>Abrir no navegador</strong>, ou copie o link e cole no Safari.
        </p>
        <button
          type="button"
          onClick={onCopy}
          className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          <Icon name={copied === "ok" ? "checkCircle" : "copy"} className="h-4 w-4" />
          {copied === "ok" ? "Link copiado" : "Copiar link"}
        </button>
        {copied === "fail" && (
          <p className="mt-2 select-all break-all rounded-lg bg-slate-100 px-2 py-1 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100">
            {window.location.origin}
          </p>
        )}
      </>
    );
  }

  const where =
    env === "ios-safari" ? (
      <>
        na barra do <strong>Safari</strong> (se não aparecer, toque antes em <Badge icon="more" />)
      </>
    ) : (
      <>
        no menu do navegador (se o passo 2 não aparecer, abra no <strong>Safari</strong>)
      </>
    );

  return (
    <>
      <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        No iPhone a instalação é feita pelo navegador:
      </p>
      <ol className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        <li className={stepClass}>
          <span className={numClass}>1</span>
          <span>
            Toque em <Badge icon="share" label="Compartilhar" /> {where}
          </span>
        </li>
        <li className={stepClass}>
          <span className={numClass}>2</span>
          <span>
            Toque em <Badge icon="plusSquare" label="Adicionar à Tela de Início" />
          </span>
        </li>
        <li className={stepClass}>
          <span className={numClass}>3</span>
          <span>
            Confirme em <strong className="text-slate-800 dark:text-slate-200">Adicionar</strong>
          </span>
        </li>
      </ol>
      {env === "ios-safari" && (
        <Icon
          name="chevronDown"
          className="mx-auto mt-1 h-5 w-5 animate-bounce text-brand motion-reduce:animate-none sm:hidden"
        />
      )}
    </>
  );
}
