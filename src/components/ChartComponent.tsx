"use client";

import { useState } from "react";
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

interface ChartComponentProps {
  data: ChartPoint[]; // Médias de 10 min das últimas 24 h, ordem cronológica
}

type SeriesKey = "co" | "temp" | "hum";

// Hex equivalentes à paleta Tailwind — o SVG do Recharts não lê classes.
const SERIES: Record<SeriesKey, { label: string; unit: string; color: string; axis: "co" | "env" }> = {
  co: { label: "CO", unit: "ppm", color: "#0f766e", axis: "co" }, // teal-700 (marca)
  temp: { label: "Temperatura", unit: "°C", color: "#ea580c", axis: "env" }, // orange-600
  hum: { label: "Umidade", unit: "%", color: "#0284c7", axis: "env" }, // sky-600
};

const GRID = "#e2e8f0"; // slate-200
const AXIS = "#64748b"; // slate-500

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
    <section className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-card lg:col-span-2">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Séries temporais das últimas 24 h</h2>
          <p className="text-sm text-slate-500">Médias a cada 10 minutos · horário de Manaus</p>
        </div>

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
                  ? "border-slate-300 bg-slate-50 text-slate-800"
                  : "border-slate-200 text-slate-400 line-through"
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
              {/* Limite de referência da EPA para CO (média de 8 h) */}
              {visible.co && (
                <ReferenceLine
                  yAxisId="co"
                  y={9}
                  stroke="#dc2626"
                  strokeDasharray="6 4"
                  label={{ value: "EPA 9 ppm", position: "insideTopLeft", fill: "#b91c1c", fontSize: 11 }}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #cbd5e1", // slate-300
                  borderRadius: 12,
                  boxShadow: "0 10px 25px -4px rgb(15 23 42 / 0.08)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "#0f172a", fontWeight: 600, marginBottom: 4 }}
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
                    return <circle key={`${key}-${i}`} cx={cx} cy={cy} r={4} fill={SERIES[key].color} stroke="#ffffff" strokeWidth={2} />;
                  }}
                  activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
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
