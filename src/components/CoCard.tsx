import { isSimulation, parseReading } from "@/lib/co";
import { coStatusKey, STATUS } from "@/lib/status-style";
import Icon from "./Icon";

interface CoCardProps {
  value: string | null | undefined; // field1 da leitura mais recente
  previous: number | null; // última leitura válida anterior (para tendência)
  updatedAt: string | null; // já formatado
  calibrated: boolean; // CO_CALIBRADO: o painel técnico mostra o valor, mas sinaliza a calibração
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous;

  if (Math.abs(delta) < 0.05) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Icon name="minus" className="h-3.5 w-3.5" />
        Estável vs. leitura anterior
      </span>
    );
  }

  const up = delta > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
      <Icon name={up ? "arrowUp" : "arrowDown"} className="h-3.5 w-3.5" strokeWidth={2.5} />
      {up ? "+" : ""}
      {delta.toFixed(1)} ppm
      <span className="sr-only">{up ? "subiu" : "caiu"}</span>
      <span className="font-normal text-slate-500 dark:text-slate-400">vs. leitura anterior</span>
    </span>
  );
}

export default function CoCard({ value, previous, updatedAt, calibrated }: CoCardProps) {
  const ppm = parseReading(value);
  const simulation = ppm !== null && isSimulation(ppm);
  const status = STATUS[coStatusKey(ppm)];
  const showNumber = ppm !== null && !simulation;

  return (
    <section
      aria-label="Nível de monóxido de carbono"
      className="relative flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold tracking-[0.08em] text-slate-500 dark:text-slate-400 uppercase">Sensor MQ-7</p>
          <div className="flex items-center gap-1.5">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">Monóxido de Carbono (CO)</h2>

            <div className="group/tip relative">
              <button
                type="button"
                aria-describedby="co-aqi-tip"
                aria-label="Sobre o índice de qualidade do ar"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Icon name="info" className="h-4 w-4" />
              </button>
              <div
                id="co-aqi-tip"
                role="tooltip"
                className="invisible absolute top-9 left-1/2 z-30 w-72 -translate-x-1/2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400 opacity-0 shadow-raised transition-opacity group-focus-within/tip:visible group-focus-within/tip:opacity-100 group-hover/tip:visible group-hover/tip:opacity-100"
              >
                <p className="mb-1 font-semibold text-slate-900 dark:text-slate-50">Índice de Qualidade do Ar (CO)</p>
                Faixas baseadas nos padrões da EPA (EUA): até <b className="text-emerald-700 dark:text-emerald-400">9 ppm</b> é aceitável
                (média de 8 h); acima de <b className="text-orange-700 dark:text-orange-400">35 ppm</b> (média de 1 h) há risco à saúde,
                principalmente para crianças, idosos e cardíacos. Leituras do MQ-7 são indicativas, não certificadas.
              </div>
            </div>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${status.solid}`}>
          <Icon name={status.icon} className="h-3.5 w-3.5" />
          {status.label}
        </span>
      </div>

      <p className="mt-4 flex flex-wrap items-baseline gap-x-1.5">
        <span
          className={`text-5xl font-extrabold tracking-tight tabular-nums ${showNumber ? status.text : "text-slate-300 dark:text-slate-600"} ${
            status.label === "Perigo" ? "animate-pulse" : ""
          }`}
        >
          {showNumber && ppm !== null ? ppm.toFixed(1) : simulation ? "---" : "—"}
        </span>
        <span className="text-base font-semibold text-slate-500 dark:text-slate-400">ppm</span>
      </p>

      <div className="mt-3 flex flex-col gap-1.5">
        {showNumber && ppm !== null && previous !== null && <TrendIndicator current={ppm} previous={previous} />}
        {ppm === null && <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Falha na leitura do sensor</span>}
        {!calibrated && (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-sky-50 dark:bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-400">
            <Icon name="gear" className="h-3.5 w-3.5" />
            Sensor em calibração: valores indicativos
          </span>
        )}
      </div>

      <p className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-500 dark:text-slate-400">
        {updatedAt ? `Atualizado em ${updatedAt}` : "Sem leituras"} · Referência EPA: 9 ppm (8 h)
      </p>
    </section>
  );
}
