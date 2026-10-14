import { getCoLevel, isSimulation, parseReading } from "@/lib/co";

interface CoCardProps {
  value: string | null | undefined; // field1 da leitura mais recente
  previous: number | null; // última leitura válida anterior (para tendência)
  updatedAt: string | null; // já formatado
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous;

  if (Math.abs(delta) < 0.05) {
    return <span className="text-xs text-slate-400">= estável vs. leitura anterior</span>;
  }

  const up = delta > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? "text-red-400" : "text-emerald-400"}`}>
      <svg className={`w-3.5 h-3.5 ${up ? "" : "rotate-180"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0-6 6m6-6 6 6" />
      </svg>
      {up ? "+" : ""}
      {delta.toFixed(1)} ppm
      <span className="sr-only">{up ? "subiu" : "caiu"}</span>
      <span className="text-slate-500 font-normal">vs. leitura anterior</span>
    </span>
  );
}

export default function CoCard({ value, previous, updatedAt }: CoCardProps) {
  const ppm = parseReading(value);
  const simulation = ppm !== null && isSimulation(ppm);
  const level = ppm !== null && !simulation ? getCoLevel(ppm) : null;

  return (
    <section
      aria-label="Nível de monóxido de carbono"
      className={`relative rounded-xl border bg-slate-800 p-6 shadow-lg transition-colors sm:col-span-2 ${
        simulation ? "border-purple-500/50" : "border-slate-700 hover:border-slate-600"
      }`}
    >
      {/* Brilho decorativo — fica num wrapper próprio para o tooltip não ser cortado */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden="true">
        <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${simulation ? "bg-purple-500/20" : level ? `${level.dot} opacity-10` : "bg-slate-500/10"}`} />
      </div>

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-slate-400">Nível de CO</h2>

          <div className="group/tip relative">
            <button
              type="button"
              aria-describedby="co-aqi-tip"
              aria-label="Sobre o índice de qualidade do ar"
              className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-600 text-[11px] font-semibold text-slate-400 transition-colors hover:border-slate-400 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              i
            </button>
            <div
              id="co-aqi-tip"
              role="tooltip"
              className="invisible absolute left-1/2 top-7 z-30 w-72 -translate-x-1/2 rounded-lg border border-slate-600 bg-slate-900 p-3 text-xs leading-relaxed text-slate-300 opacity-0 shadow-xl transition-opacity group-hover/tip:visible group-hover/tip:opacity-100 group-focus-within/tip:visible group-focus-within/tip:opacity-100"
            >
              <p className="mb-1 font-semibold text-slate-100">Índice de Qualidade do Ar (CO)</p>
              Faixas baseadas nos padrões da EPA (EUA): até <b className="text-cyan-400">9 ppm</b> é aceitável
              (média de 8 h); acima de <b className="text-orange-500">35 ppm</b> (média de 1 h) há risco à saúde,
              principalmente para crianças, idosos e cardíacos. Leituras do MQ-7 são indicativas, não certificadas.
            </div>
          </div>
        </div>

        {level && (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-900/60 px-2.5 py-1 text-xs font-semibold ${level.text}`}>
            <span className={`h-2 w-2 rounded-full ${level.dot} ${level.pulse ? "animate-pulse" : ""}`} />
            {level.label}
          </span>
        )}
      </div>

      <div className="relative mt-4 flex items-baseline gap-2">
        <p
          className={`text-5xl font-bold tracking-tight tabular-nums sm:text-6xl ${
            level ? `${level.text} ${level.pulse ? "animate-pulse" : ""}` : simulation ? "text-purple-400/60" : "text-slate-500"
          }`}
        >
          {level ? ppm!.toFixed(1) : simulation ? "---" : "--"}
        </p>
        <span className="text-base font-medium text-slate-500">PPM</span>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {simulation && (
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-400/50 bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200 shadow-[0_0_18px_rgba(168,85,247,0.55)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400" />
            Modo Simulação Ativo
          </span>
        )}
        {level && previous !== null && <TrendIndicator current={ppm!} previous={previous} />}
        {ppm === null && <span className="text-xs text-yellow-400/80">Falha na leitura do sensor</span>}
        {updatedAt && <span className="text-xs text-slate-500">Atualizado em {updatedAt}</span>}
      </div>
    </section>
  );
}
