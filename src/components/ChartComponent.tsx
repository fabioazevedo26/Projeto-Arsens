"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/lib/feed";
import { formatBucket, type ChartRange } from "@/lib/period";
import ChartPeriodFilter from "./ChartPeriodFilter";
import { useIsDark } from "@/lib/theme";

interface ChartComponentProps {
  data: ChartPoint[]; // Médias do período escolhido, ordem cronológica
  range: ChartRange;
  failed?: boolean; // a busca do período no ThingSpeak falhou
}

type SeriesKey = "co" | "temp" | "hum";

// Hex equivalentes à paleta Tailwind — o SVG do Recharts não lê classes.
const SERIES: Record<SeriesKey, { label: string; unit: string; axis: "co" | "env" }> = {
  co: { label: "CO", unit: "ppm", axis: "co" },
  temp: { label: "Temperatura", unit: "°C", axis: "env" },
  hum: { label: "Umidade", unit: "%", axis: "env" },
};

// Cores por tema (hex do Tailwind). No escuro, tons mais claros para manter o contraste.
const PALETTE = {
  light: {
    series: { co: "#0f766e", temp: "#ea580c", hum: "#0284c7" }, // teal-700, orange-600, sky-600
    grid: "#e2e8f0", // slate-200
    axis: "#64748b", // slate-500
    surface: "#ffffff",
    border: "#cbd5e1", // slate-300
    text: "#0f172a", // slate-900
    limit: "#dc2626", // red-600
    limitLabel: "#b91c1c", // red-700
  },
  dark: {
    series: { co: "#2dd4bf", temp: "#fb923c", hum: "#38bdf8" }, // teal-400, orange-400, sky-400
    grid: "#1e293b", // slate-800
    axis: "#94a3b8", // slate-400
    surface: "#0f172a", // slate-900
    border: "#334155", // slate-700
    text: "#f1f5f9", // slate-100
    limit: "#f87171", // red-400
    limitLabel: "#fca5a5", // red-300
  },
} as const;

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("pt-BR", { timeZone: "America/Manaus", hour: "2-digit", minute: "2-digit" });

const formatDay = (ts: number) =>
  new Date(ts).toLocaleDateString("pt-BR", { timeZone: "America/Manaus", day: "2-digit", month: "2-digit" });

const formatDayHour = (ts: number) => `${formatDay(ts)} ${formatTime(ts)}`;

// Eixo X conforme a duração: até ~1,5 dia o Recharts escolhe as horas; acima disso as marcas
// caem à meia-noite (ou meio-dia) de Manaus, com no máximo ~8 marcas.
const HOUR_MS = 3_600_000;
const MANAUS_OFFSET_MS = 4 * HOUR_MS; // 00:00 em Manaus = 04:00 UTC
const TICK_STEPS_H = [12, 24, 48, 96, 168, 336];

function axisFor(start: number, end: number): { ticks?: number[]; format: (ts: number) => string } {
  const hours = (end - start) / HOUR_MS;
  if (hours <= 36) return { format: formatTime };
  // Marcas de 12 h só até 2 dias; acima disso, um dia ou mais por marca
  const steps = hours <= 48 ? TICK_STEPS_H : TICK_STEPS_H.slice(1);
  const stepH = steps.find((h) => hours / h <= 8) ?? steps[steps.length - 1];
  const step = stepH * HOUR_MS;
  const ticks: number[] = [];
  for (let t = Math.ceil((start - MANAUS_OFFSET_MS) / step) * step + MANAUS_OFFSET_MS; t <= end; t += step) ticks.push(t);
  return { ticks, format: stepH < 24 ? formatDayHour : formatDay };
}

const formatDateTime = (ts: number) =>
  new Date(ts).toLocaleString("pt-BR", {
    timeZone: "America/Manaus",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ChartComponent({ data, range, failed = false }: ChartComponentProps) {
  const P = useIsDark() ? PALETTE.dark : PALETTE.light;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  // Troca o período mudando a URL (o servidor busca os dados de novo), sem rolar a página
  const changePeriod = (query: string) => {
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  const axis = axisFor(range.start, range.end);
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({ co: true, temp: true, hum: true });

  const toggle = (key: SeriesKey) => setVisible((v) => ({ ...v, [key]: !v[key] }));
  const showEnvAxis = visible.temp || visible.hum;

  return (
    <section className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card lg:col-span-2">
      <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">Séries temporais</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{range.label}</span> · médias a cada{" "}
              {formatBucket(range.bucketMinutes)} · horário de Manaus
            </p>
          </div>
          <ChartPeriodFilter range={range} pending={pending} onChange={changePeriod} />
        </div>
        {range.notice && (
          <p role="status" className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            {range.notice}
          </p>
        )}

        {/* Legenda interativa: liga/desliga cada série */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Séries do gráfico">
          {(Object.keys(SERIES) as SeriesKey[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={visible[key]}
              onClick={() => toggle(key)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors ${
                visible[key]
                  ? "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100"
                  : "border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 line-through"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: P.series[key] }} />
              {SERIES[key].label} ({SERIES[key].unit})
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-56 px-1 py-3 sm:h-80 sm:px-2 sm:py-4" aria-busy={pending}>
        {pending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm font-semibold text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            Carregando período…
          </div>
        )}
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {failed
              ? "Não foi possível buscar as leituras deste período. Tente novamente em instantes."
              : `Sem leituras válidas no período (${range.label.toLowerCase()}).`}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={P.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="ts"
                type="number"
                scale="time"
                domain={[range.start, range.end]}
                allowDataOverflow
                ticks={axis.ticks}
                tickFormatter={axis.format}
                stroke={P.axis}
                tick={{ fill: P.axis, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: P.grid }}
                minTickGap={32}
              />
              <YAxis
                yAxisId="co"
                hide={!visible.co}
                stroke={P.series.co}
                tick={{ fill: P.axis, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={44}
                domain={[0, "auto"]}
                label={{ value: "ppm", angle: -90, position: "insideLeft", fill: P.axis, fontSize: 11 }}
              />
              <YAxis
                yAxisId="env"
                orientation="right"
                hide={!showEnvAxis}
                tick={{ fill: P.axis, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={40}
                domain={[0, 100]}
                label={{ value: "°C / %", angle: 90, position: "insideRight", fill: P.axis, fontSize: 11 }}
              />
              {/* Limite de referência da EPA para CO (média de 8 h) */}
              {visible.co && (
                <ReferenceLine
                  yAxisId="co"
                  y={9}
                  stroke={P.limit}
                  strokeDasharray="6 4"
                  label={{ value: "EPA 9 ppm", position: "insideTopLeft", fill: P.limitLabel, fontSize: 11 }}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: P.surface,
                  color: P.text,
                  border: `1px solid ${P.border}`,
                  borderRadius: 12,
                  boxShadow: "0 10px 25px -4px rgb(15 23 42 / 0.08)",
                  fontSize: 12,
                }}
                labelStyle={{ color: P.text, fontWeight: 600, marginBottom: 4 }}
                labelFormatter={(ts) => formatDateTime(Number(ts))}
                formatter={(value, name) => {
                  const s = SERIES[name as SeriesKey];
                  return [`${Number(value).toFixed(1)} ${s.unit}`, s.label];
                }}
              />
              {(Object.keys(SERIES) as SeriesKey[]).map((key) => (
                <Line
                  key={key}
                  yAxisId={SERIES[key].axis}
                  type="monotone"
                  dataKey={key}
                  name={key}
                  hide={!visible[key]}
                  stroke={P.series[key]}
                  strokeWidth={key === "co" ? 2.5 : 1.5}
                  // Só desenha ponto em leituras isoladas (sem vizinhos), que não formam linha
                  dot={({ cx, cy, index }: { cx?: number; cy?: number; index?: number }) => {
                    const i = index ?? 0;
                    const isolated = data[i - 1]?.[key] == null && data[i + 1]?.[key] == null;
                    if (!isolated || cx == null || cy == null || data[i]?.[key] == null) {
                      return <g key={`${key}-${i}`} />;
                    }
                    return <circle key={`${key}-${i}`} cx={cx} cy={cy} r={4} fill={P.series[key]} stroke={P.surface} strokeWidth={2} />;
                  }}
                  activeDot={{ r: 5, stroke: P.surface, strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
