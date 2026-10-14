"use client";

import { useState } from "react";
import { getCoLevel, parseReading } from "@/lib/co";
import { getRowStatus, type Feed } from "@/lib/feed";

interface HistoryTableProps {
  feeds: Feed[]; // Mais recentes primeiro
}

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString("pt-BR", { timeZone: "America/Manaus" });

const cell = (value: string | null) => {
  const n = parseReading(value);
  return n !== null ? n.toFixed(2) : "0.00";
};

export default function HistoryTable({ feeds }: HistoryTableProps) {
  const [hideErrors, setHideErrors] = useState(true);

  const rows = feeds.map((feed) => ({ feed, status: getRowStatus(feed) }));
  const errorCount = rows.filter((r) => r.status === "erro").length;
  const visibleRows = hideErrors ? rows.filter((r) => r.status !== "erro") : rows;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-lg">
      <div className="flex flex-col gap-3 border-b border-slate-700 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Últimas {feeds.length} leituras</h2>
          <p className="text-xs text-slate-400">
            {errorCount > 0
              ? `${errorCount} leitura${errorCount > 1 ? "s" : ""} com falha do sensor (valores 0.00)`
              : "Nenhuma falha de leitura detectada"}
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300 select-none">
          Ocultar leituras com erro
          <button
            type="button"
            role="switch"
            aria-checked={hideErrors}
            onClick={() => setHideErrors((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              hideErrors ? "bg-cyan-500" : "bg-slate-600"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                hideErrors ? "translate-x-5" : ""
              }`}
            />
          </button>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-900/50 text-xs font-medium tracking-wider text-slate-400 uppercase">
              <th className="px-5 py-3">Data / Hora</th>
              <th className="px-5 py-3 text-right">CO (ppm)</th>
              <th className="px-5 py-3 text-right">Temp. (°C)</th>
              <th className="px-5 py-3 text-right">Umidade (%)</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 tabular-nums">
            {visibleRows.map(({ feed, status }) => {
              const co = parseReading(feed.field1);
              const coClass =
                status === "simulacao" ? "text-purple-400" : co !== null ? getCoLevel(co).text : "text-slate-500";

              return (
                <tr
                  key={feed.entry_id}
                  className={`transition-colors hover:bg-slate-700/30 ${status === "erro" ? "opacity-50" : ""}`}
                >
                  <td className="px-5 py-3 whitespace-nowrap text-slate-300">{formatDateTime(feed.created_at)}</td>
                  <td className={`px-5 py-3 text-right font-semibold whitespace-nowrap ${coClass}`}>
                    {status === "simulacao" ? "---" : cell(feed.field1)}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap text-slate-200">{cell(feed.field2)}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap text-slate-200">{cell(feed.field3)}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {status === "ok" && <span className="text-xs text-slate-500">OK</span>}
                    {status === "erro" && (
                      <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-300">
                        Erro
                      </span>
                    )}
                    {status === "simulacao" && (
                      <span className="rounded-full border border-purple-500/40 bg-purple-500/15 px-2 py-0.5 text-xs font-medium text-purple-300">
                        Simulação
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  Nenhum registro para exibir.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-700 bg-slate-900/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          Para pesquisa acadêmica: até 8.000 leituras, com coluna de status.{" "}
          <a href="/dashboard/export?formato=padrao" download className="text-cyan-400 underline-offset-2 hover:underline">
            CSV padrão (Python/R)
          </a>
        </p>
        <a
          href="/dashboard/export"
          download
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" />
          </svg>
          Baixar Histórico (Excel)
        </a>
      </div>
    </section>
  );
}
