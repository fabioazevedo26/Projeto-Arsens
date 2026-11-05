import { parseReading } from "@/lib/co";
import Icon, { type IconName } from "./Icon";

interface MetricCardProps {
  eyebrow: string; // origem do dado (ex.: "BME280")
  label: string;
  short?: string; // rótulo curto para o card pequeno do celular
  value: string | number | null | undefined;
  unit: string;
  icon: IconName;
  tone: string; // classes do selo do ícone (ex.: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400")
  format?: (reading: number) => { value: string; unit: string }; // padrão: 1 casa decimal + `unit`
  caption?: string; // legenda pequena abaixo do valor
  emptyText?: string; // texto sem leitura (padrão "--")
  showFailure?: boolean; // mostra "Falha na leitura" quando vazio (padrão true)
}

export default function MetricCard({
  eyebrow,
  label,
  short,
  value,
  unit,
  icon,
  tone,
  format,
  caption,
  emptyText = "--",
  showFailure = true,
}: MetricCardProps) {
  const reading = typeof value === "number" ? value : parseReading(value);
  const display = reading === null ? null : format ? format(reading) : { value: reading.toFixed(1), unit };

  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-card sm:rounded-3xl sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="hidden text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase sm:block dark:text-slate-400">{eyebrow}</p>
          <h2 className="text-xs font-semibold text-slate-900 sm:text-base dark:text-slate-50">
            <span className="sm:hidden">{short ?? label}</span>
            <span className="hidden sm:inline">{label}</span>
          </h2>
        </div>
        <span className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex ${tone}`} aria-hidden="true">
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-1 sm:mt-4 sm:gap-1.5">
        <span className={`text-2xl font-extrabold sm:text-5xl tracking-tight tabular-nums ${display ? "text-slate-900 dark:text-slate-50" : "text-slate-300 dark:text-slate-600"}`}>
          {display ? display.value : emptyText}
        </span>
        {display && <span className="text-xs font-semibold text-slate-500 sm:text-base dark:text-slate-400">{display.unit}</span>}
      </p>
      <div className="mt-auto hidden pt-3 sm:block">
        {reading === null && showFailure && <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Falha na leitura</p>}
        {caption && <p className="text-xs text-slate-500 dark:text-slate-400">{caption}</p>}
      </div>
    </section>
  );
}
