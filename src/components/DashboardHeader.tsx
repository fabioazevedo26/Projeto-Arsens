import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/actions";
import RefreshButton from "@/app/dashboard/RefreshButton";

interface DashboardHeaderProps {
  isLive: boolean;
  lastSeen: string; // ex.: "há 12 min"
}

const TELEGRAM_URL = process.env.TELEGRAM_BOT_URL ?? "#";

function TelegramIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.4 4.1 2.9 11.3c-1.1.4-1.1 1.6 0 1.9l4.6 1.4 1.8 5.5c.3.9 1.3 1.1 2 .5l2.6-2.4 4.9 3.6c.8.6 1.9.1 2.1-.9l3-14.5c.2-1.2-.9-2.1-2.5-1.3zM9.9 14.1l8-7.3-6.3 8.4-.3 3.4-1.4-4.5z" />
    </svg>
  );
}

export default function DashboardHeader({ isLive, lastSeen }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-700/80 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo.png.jpeg"
            alt="Logo ARSENS"
            width={40}
            height={40}
            className="rounded-md object-contain"
          />
          <div className="min-w-0">
            <p className="text-lg leading-tight font-bold tracking-wide text-white">ARSENS</p>
            <p className="hidden truncate text-xs text-slate-400 sm:block">Monitoramento ambiental · Manaus</p>
          </div>

          {/* Status de conexão */}
          <span
            className={`ml-1 inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${
              isLive
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-slate-600 bg-slate-800 text-slate-400"
            }`}
            title={`Última leitura ${lastSeen}`}
          >
            <span className="relative flex h-2 w-2">
              {isLive && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${isLive ? "bg-emerald-400" : "bg-slate-500"}`} />
            </span>
            {isLive ? "Ao vivo" : <span>Offline <span className="hidden sm:inline">· {lastSeen}</span></span>}
          </span>
        </div>

        <nav className="flex shrink-0 items-center gap-2">
          <Link
            href="/sobre"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white md:inline-flex"
          >
            Sobre
          </Link>
          <a
            href={TELEGRAM_URL}
            target={TELEGRAM_URL === "#" ? undefined : "_blank"}
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-colors hover:bg-sky-400"
          >
            <TelegramIcon />
            <span className="hidden lg:inline">Receber Alertas no Telegram</span>
            <span className="hidden sm:inline lg:hidden">Alertas</span>
          </a>
          <RefreshButton />
          <form action={logout}>
            <button
              type="submit"
              aria-label="Sair"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17l5-5-5-5M20 12H9M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
              </svg>
              <span className="hidden md:inline">Sair</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
