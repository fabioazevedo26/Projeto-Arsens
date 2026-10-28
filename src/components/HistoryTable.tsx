"use client";

import { useState } from "react";
import { parseReading } from "@/lib/co";
import { formatRsText, getRowStatus, type Feed, type RowStatus } from "@/lib/feed";
import { coStatusKey, STATUS } from "@/lib/status-style";
import Icon, { type IconName } from "./Icon";

interface HistoryTableProps {
  feeds: Feed[]; // Mais recentes primeiro
}

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString("pt-BR", { timeZone: "America/Manaus" });

const cell = (value: string | null) => {
  const n = parseReading(value);
  return n !== null ? n.toFixed(2) : "0.00";
};

// Etiqueta de diagnóstico de cada linha (cor + ícone + texto)
const ROW_BADGE: Record<RowStatus, { label: string; icon: IconName; className: string }> = {
  ok: { label: "OK · Válido", icon: "checkCircle", className: "bg-teal-50 dark:bg-teal-500/10 text-teal-800 dark:text-teal-200" },
  erro: { label: "Erro", icon: "alertCircle", className: "bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-100" },
  simulacao: { label: "Simulação", icon: "play", className: "bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-200" },
};

export default function HistoryTable({ feeds }: HistoryTableProps) {
  const [hideErrors, setHideErrors] = useState(true);

  const rows = feeds.map((feed) => ({ feed, status: getRowStatus(feed) }));
  const errorCount = rows.filter((r) => r.status === "erro").length;
  const visibleRows = hideErrors ? rows.filter((r) => r.status !== "erro") : rows;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card">
      <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">Histórico de telemetria recente</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Últimas {feeds.length} leituras brutas ·{" "}
            {errorCount > 0
              ? `${errorCount} com falha do sensor (valores 0.00)`
              : "nenhuma falha de leitura detectada"}
          </p>
        </div>

        <label className="flex min-h-12 cursor-pointer items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300 select-none">
          Ocultar leituras com erro
          <button
            type="button"
            role="switch"
            aria-checked={hideErrors}
            onClick={() => setHideErrors((v) => !v)}
            className={`relative h-7 w-12 rounded-full transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/20 ${
              hideErrors ? "bg-brand" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white dark:bg-slate-900 shadow transition-transform ${
                hideErrors ? "translate-x-5" : ""
              }`}
            />
          </button>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold tracking-[0.08em] text-slate-500 dark:text-slate-400 uppercase">
              <th className="px-5 py-3">Data / Hora</th>
              <th className="px-5 py-3 text-right">CO <span className="normal-case">(ppm)</span></th>
              <th className="px-5 py-3 text-right">Temp. (°C)</th>
              <th className="px-5 py-3 text-right">Umidade (%)</th>
              <th className="px-5 py-3 text-right">Rs <span className="normal-case">(kΩ)</span></th>
              <th className="px-5 py-3">Diagnóstico</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
            {visibleRows.map(({ feed, status }) => {
              const co = parseReading(feed.field1);
              const coClass = status === "simulacao" ? "text-violet-700 dark:text-violet-400" : co !== null ? STATUS[coStatusKey(co)].text : "text-slate-400 dark:text-slate-500";
              const badge = ROW_BADGE[status];

              return (
                <tr
                  key={feed.entry_id}
                  className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${status === "erro" ? "bg-amber-50/40 dark:bg-amber-500/5 text-slate-400 dark:text-slate-500" : ""}`}
                >
                  <td className="px-5 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">{formatDateTime(feed.created_at)}</td>
                  <td className={`px-5 py-3 text-right font-bold whitespace-nowrap ${coClass}`}>
                    {status === "simulacao" ? "---" : cell(feed.field1)}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap text-slate-700 dark:text-slate-300">{cell(feed.field2)}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap text-slate-700 dark:text-slate-300">{cell(feed.field3)}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap text-slate-700 dark:text-slate-300">{formatRsText(feed.rs)}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
                      <Icon name={badge.icon} className="h-3.5 w-3.5" />
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                  Nenhum registro para exibir.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">Para pesquisa acadêmica: até 8.000 leituras, com coluna de status.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href="/dashboard/export?formato=padrao"
            download
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-brand-strong dark:border-teal-400 bg-white dark:bg-slate-900 px-4 text-sm font-semibold text-brand-strong dark:text-teal-300 transition-colors hover:bg-teal-50 dark:hover:bg-teal-500/10"
          >
            <Icon name="download" className="h-4 w-4" />
            CSV padrão (Python/R)
          </a>
          <a
            href="/dashboard/export"
            download
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-strong active:scale-[0.98]"
          >
            <Icon name="download" className="h-4 w-4" />
            Baixar Histórico (.xlsx)
          </a>
        </div>
      </div>
    </section>
  );
}
