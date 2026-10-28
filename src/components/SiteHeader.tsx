import Image from "next/image";
import Link from "next/link";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";

type Section = "cidadao" | "tecnico" | "sobre";

interface SiteHeaderProps {
  active: Section;
  // Status de conexão do sensor (omitido em páginas que não buscam dados, como "Sobre")
  live?: { isLive: boolean; lastSeen: string };
}

const TELEGRAM_URL = process.env.TELEGRAM_BOT_URL ?? "#";

const NAV: { key: Section; href: string; label: string; short: string }[] = [
  { key: "cidadao", href: "/", label: "Painel Cidadão", short: "Cidadão" },
  { key: "tecnico", href: "/dashboard", label: "Painel Técnico", short: "Técnico" },
  { key: "sobre", href: "/sobre", label: "Sobre o Projeto", short: "Sobre" },
];

function NavTabs({ active, className }: { active: Section; className: string }) {
  return (
    <nav aria-label="Seções do site" className={className}>
      {NAV.map((item) => {
        const current = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`flex min-h-12 flex-1 items-center justify-center rounded-xl px-3 text-center text-sm font-semibold transition-colors md:min-h-10 md:flex-none md:px-4 ${
              current ? "bg-brand text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-slate-50"
            }`}
          >
            <span className="md:hidden">{item.short}</span>
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function SiteHeader({ active, live }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:h-20 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="ARSENS — página inicial">
          <Image src="/logo.png.jpeg" alt="Logo ARSENS" width={44} height={44} className="shrink-0 rounded-lg object-contain" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-base font-bold tracking-tight text-brand-strong dark:text-teal-300">ARSENS</span>
              {live && (
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${
                    live.isLive ? "bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-200" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                  title={`Última leitura ${live.lastSeen}`}
                >
                  <span className={`h-2 w-2 rounded-full ${live.isLive ? "animate-pulse bg-brand" : "bg-slate-400"}`} />
                  {live.isLive ? "Ao vivo" : "Sem sinal"}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">Av. Djalma Batista · Millennium / Uninorte</p>
          </div>
        </Link>

        <NavTabs active={active} className="hidden items-center gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 md:flex" />

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <a
            href={TELEGRAM_URL}
            target={TELEGRAM_URL === "#" ? undefined : "_blank"}
            rel="noopener noreferrer"
            aria-label="Receber alertas no Telegram"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl border-[1.5px] border-brand-strong dark:border-teal-400 bg-white dark:bg-slate-900 px-3 text-sm font-semibold text-brand-strong dark:text-teal-300 transition-colors hover:bg-teal-50 dark:hover:bg-teal-500/10 lg:px-4"
          >
            <Icon name="send" className="h-4 w-4" />
            <span className="hidden lg:inline">Alertas no Telegram</span>
          </a>
        </div>
      </div>

      {/* No celular, as abas ficam numa segunda linha, com área de toque de 48 px */}
      <NavTabs active={active} className="flex gap-1 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-1 md:hidden" />
    </header>
  );
}
