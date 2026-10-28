import { parseReading } from "@/lib/co";
import Icon, { type IconName } from "./Icon";

interface MetricCardProps {
  eyebrow: string; // origem do dado (ex.: "BME280")
  label: string;
  value: string | number | null | undefined;
  unit: string;
  icon: IconName;
  tone: string; // classes do selo do ícone (ex.: "bg-orange-50 text-orange-600")
  format?: (reading: number) => { value: string; unit: string }; // padrão: 1 casa decimal + `unit`
  caption?: string; // legenda pequena abaixo do valor
  emptyText?: string; // texto sem leitura (padrão "--")
  showFailure?: boolean; // mostra "Falha na leitura" quando vazio (padrão true)
}

export default function MetricCard({
  eyebrow,
  label,
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
    <section className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase">{eyebrow}</p>
          <h2 className="font-semibold text-slate-900">{label}</h2>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`} aria-hidden="true">
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 flex items-baseline gap-1.5">
        <span className={`text-5xl font-extrabold tracking-tight tabular-nums ${display ? "text-slate-900" : "text-slate-300"}`}>
          {display ? display.value : emptyText}
        </span>
        {display && <span className="text-base font-semibold text-slate-500">{display.unit}</span>}
      </p>
      <div className="mt-auto pt-3">
        {reading === null && showFailure && <p className="text-xs font-semibold text-amber-700">Falha na leitura</p>}
        {caption && <p className="text-xs text-slate-500">{caption}</p>}
      </div>
    </section>
  );
}
