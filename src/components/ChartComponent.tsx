"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/lib/feed";

interface ChartComponentProps {
  data: ChartPoint[]; // Médias de 10 min das últimas 24 h, ordem cronológica
}

type SeriesKey = "co" | "temp" | "hum";

// Hex equivalentes à paleta Tailwind — o SVG do Recharts não lê classes.
const SERIES: Record<SeriesKey, { label: string; unit: string; color: string; axis: "co" | "env" }> = {
  co: { label: "CO", unit: "ppm", color: "#22d3ee", axis: "co" }, // cyan-400
  temp: { label: "Temperatura", unit: "°C", color: "#f472b6", axis: "env" }, // pink-400
  hum: { label: "Umidade", unit: "%", color: "#818cf8", axis: "env" }, // indigo-400
};

const GRID = "#334155"; // slate-700
const AXIS = "#94a3b8"; // slate-400

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("pt-BR", { timeZone: "America/Manaus", hour: "2-digit", minute: "2-digit" });

const formatDateTime = (ts: number) =>
  new Date(ts).toLocaleString("pt-BR", {
    timeZone: "America/Manaus",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ChartComponent({ data }: ChartComponentProps) {
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({ co: true, temp: true, hum: true });

  const toggle = (key: SeriesKey) => setVisible((v) => ({ ...v, [key]: !v[key] }));
  const showEnvAxis = visible.temp || visible.hum;

  return (
    <section className="flex flex-col rounded-xl border border-slate-700 bg-slate-800 shadow-lg lg:col-span-2">
      <div className="flex flex-col gap-3 border-b border-slate-700 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Histórico das últimas 24 h</h2>
          <p className="text-xs text-slate-400">Médias a cada 10 minutos · horário de Manaus</p>
        </div>

        {/* Legenda interativa: liga/desliga cada série */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Séries do gráfico">
          {(Object.keys(SERIES) as SeriesKey[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={visible[key]}
              onClick={() => toggle(key)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                visible[key]
                  ? "border-slate-600 bg-slate-900/60 text-slate-200"
                  : "border-slate-700 text-slate-500 line-through"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SERIES[key].color }} />
              {SERIES[key].label} ({SERIES[key].unit})
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 px-2 py-4 sm:h-80">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-500">
            Sem leituras válidas nas últimas 24 horas.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="ts"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={formatTime}
                stroke={AXIS}
                tick={{ fill: AXIS, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: GRID }}
                minTickGap={32}
              />
              <YAxis
                yAxisId="co"
                hide={!visible.co}
                stroke={SERIES.co.color}
                tick={{ fill: AXIS, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={44}
                domain={[0, "auto"]}
                label={{ value: "ppm", angle: -90, position: "insideLeft", fill: AXIS, fontSize: 11 }}
              />
              <YAxis
                yAxisId="env"
                orientation="right"
                hide={!showEnvAxis}
                tick={{ fill: AXIS, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={40}
                domain={[0, 100]}
                label={{ value: "°C / %", angle: 90, position: "insideRight", fill: AXIS, fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a", // slate-900
                  border: `1px solid ${GRID}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: AXIS, marginBottom: 4 }}
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
                  stroke={SERIES[key].color}
                  strokeWidth={key === "co" ? 2.5 : 1.5}
                  // Só desenha ponto em leituras isoladas (sem vizinhos), que não formam linha
                  dot={({ cx, cy, index }: { cx?: number; cy?: number; index?: number }) => {
                    const i = index ?? 0;
                    const isolated = data[i - 1]?.[key] == null && data[i + 1]?.[key] == null;
                    if (!isolated || cx == null || cy == null || data[i]?.[key] == null) {
                      return <g key={`${key}-${i}`} />;
                    }
                    return <circle key={`${key}-${i}`} cx={cx} cy={cy} r={3} fill={SERIES[key].color} />;
                  }}
                  activeDot={{ r: 4 }}
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
