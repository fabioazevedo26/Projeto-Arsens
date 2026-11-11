"use client";

import { useState, type FormEvent } from "react";
import { MAX_RANGE_DAYS, PRESETS, todayInManaus, type ChartRange } from "@/lib/period";

// Primeiro dia com leituras válidas (antes disso, firmware antigo: ver VALID_FROM_MS em feed.ts)
const MIN_DATE = "2026-10-18";

interface ChartPeriodFilterProps {
  range: ChartRange;
  pending: boolean;
  onChange: (query: string) => void; // recebe a query string nova (ex.: "periodo=7d")
}

const DAY_MS = 24 * 60 * 60_000;

// Filtro do gráfico: atalhos (24 h, semana, mês) e um intervalo específico de datas.
// O período fica na URL, então dá para recarregar ou compartilhar o link com o mesmo filtro.
export default function ChartPeriodFilter({ range, pending, onChange }: ChartPeriodFilterProps) {
  const today = todayInManaus();
  const [showCustom, setShowCustom] = useState(range.key === "intervalo");
  const [inicio, setInicio] = useState(range.inicio ?? "");
  const [fim, setFim] = useState(range.fim ?? today);
  const [error, setError] = useState<string | null>(null);

  const apply = (event: FormEvent) => {
    event.preventDefault();
    if (!inicio || !fim) return setError("Escolha as duas datas.");
    if (inicio > fim) return setError("A data inicial deve ser antes da final.");
    const days = (Date.parse(fim) - Date.parse(inicio)) / DAY_MS + 1;
    if (days > MAX_RANGE_DAYS) return setError(`O intervalo máximo é de ${MAX_RANGE_DAYS} dias.`);
    setError(null);
    onChange(new URLSearchParams({ periodo: "intervalo", inicio, fim }).toString());
  };

  const segment = (active: boolean) =>
    `inline-flex min-h-10 flex-1 items-center justify-center rounded-xl px-3 text-xs font-semibold transition-colors sm:flex-none ${
      active
        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-50"
        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
    }`;

  return (
    <div className="flex flex-col gap-2">
      <div
        role="group"
        aria-label="Período do gráfico"
        className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/60"
        aria-busy={pending}
      >
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={range.key === p.key && !showCustom}
            disabled={pending}
            onClick={() => {
              setShowCustom(false);
              setError(null);
              if (range.key !== p.key) onChange(p.key === "24h" ? "" : `periodo=${p.key}`);
            }}
            className={segment(range.key === p.key && !showCustom)}
          >
            {p.short}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={showCustom}
          aria-expanded={showCustom}
          disabled={pending}
          onClick={() => setShowCustom((v) => !v)}
          className={segment(showCustom)}
        >
          Intervalo
        </button>
      </div>

      {showCustom && (
        <form onSubmit={apply} className="flex flex-wrap items-end gap-2" noValidate>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
            De
            <input
              type="date"
              value={inicio}
              min={MIN_DATE}
              max={fim || today}
              onChange={(e) => setInicio(e.target.value)}
              className="min-h-10 rounded-xl border border-slate-300 bg-white px-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
            Até
            <input
              type="date"
              value={fim}
              min={inicio || MIN_DATE}
              max={today}
              onChange={(e) => setFim(e.target.value)}
              className="min-h-10 rounded-xl border border-slate-300 bg-white px-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
          >
            Aplicar
          </button>
          {error && (
            <p role="alert" className="w-full text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
