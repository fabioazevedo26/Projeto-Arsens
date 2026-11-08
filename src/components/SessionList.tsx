"use client";

import type { Session } from "@/lib/feed";

interface SessionListProps {
  sessions: Session[]; // da mais recente para a mais antiga
  selected: number; // start da sessão escolhida
  onSelect: (start: number) => void;
}

const TZ = "America/Manaus";

const day = (ts: number) =>
  new Date(ts).toLocaleDateString("pt-BR", { timeZone: TZ, weekday: "short", day: "2-digit", month: "2-digit" });
const dayKey = (ts: number) => new Date(ts).toLocaleDateString("sv-SE", { timeZone: TZ });
const time = (ts: number) =>
  new Date(ts).toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const shortDay = (ts: number) =>
  new Date(ts).toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" });

// "08:00–17:30", "08:00–agora" ou, se passar da meia-noite, "08:00 – 04/11 10:00"
export function sessionHours(s: Session): string {
  const endText = s.live ? "agora" : time(s.end);
  if (dayKey(s.start) === dayKey(s.end) || s.live) return `${time(s.start)}–${endText}`;
  return `${time(s.start)} – ${shortDay(s.end)} ${time(s.end)}`;
}

export function sessionDay(s: Session): string {
  return day(s.start).replace(".", "");
}

export function formatDuration(ms: number): string {
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${Math.max(min, 1)} min`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  if (h < 24) return rest ? `${h} h ${rest} min` : `${h} h`;
  const d = Math.floor(h / 24);
  return h % 24 ? `${d} d ${h % 24} h` : `${d} d`;
}

// Lista das sessões de medição do período. Escolher uma mostra só ela no gráfico.
export default function SessionList({ sessions, selected, onSelect }: SessionListProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold tracking-[0.08em] text-slate-500 uppercase dark:text-slate-400">
        {sessions.length === 1 ? "1 sessão de medição no período" : `${sessions.length} sessões de medição no período`}
      </p>
      <ul aria-label="Sessões de medição" className="max-h-[10.5rem] space-y-1 overflow-y-auto overscroll-contain pr-1 sm:max-h-[8.75rem]">
        {sessions.map((s) => {
          const active = s.start === selected;
          return (
            <li key={s.start}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(s.start)}
                className={`flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left text-sm transition-colors ${
                  active
                    ? "bg-teal-50 text-slate-900 ring-1 ring-teal-600/40 dark:bg-teal-500/10 dark:text-slate-50 dark:ring-teal-400/40"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 ${
                    active ? "border-brand bg-brand dark:border-teal-400 dark:bg-teal-400" : "border-slate-300 dark:border-slate-600"
                  }`}
                />
                {/* Celular: horário numa linha, duração e leituras na de baixo. Telas maiores: uma linha só */}
                <span className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <span className="whitespace-nowrap">
                    <span className="font-semibold">{sessionDay(s)}</span>{" "}
                    <span className="tabular-nums">{sessionHours(s)}</span>
                    {s.live && (
                      <span className="ml-2 rounded-full bg-teal-100 px-1.5 py-0.5 text-[0.6875rem] font-bold text-teal-800 dark:bg-teal-500/20 dark:text-teal-300">
                        ao vivo
                      </span>
                    )}
                  </span>
                  <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    {formatDuration(s.end - s.start)} · {s.count} {s.count === 1 ? "leitura" : "leituras"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
