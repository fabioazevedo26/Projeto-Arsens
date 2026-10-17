import { parseReading } from "@/lib/co";

interface MetricCardProps {
  label: string;
  value: string | number | null | undefined;
  unit: string;
  accent: string; // classe de cor do texto do valor
  icon: React.ReactNode;
  format?: (reading: number) => { value: string; unit: string }; // padrão: 1 casa decimal + `unit`
  caption?: string; // legenda pequena abaixo do valor
  emptyText?: string; // texto sem leitura (padrão "--")
  showFailure?: boolean; // mostra "Falha na leitura" quando vazio (padrão true)
}

export default function MetricCard({
  label,
  value,
  unit,
  accent,
  icon,
  format,
  caption,
  emptyText = "--",
  showFailure = true,
}: MetricCardProps) {
  const reading = typeof value === "number" ? value : parseReading(value);
  const display = reading === null ? null : format ? format(reading) : { value: reading.toFixed(1), unit };

  return (
    <section className="flex flex-col justify-between rounded-xl border border-slate-700 bg-slate-800 p-5 shadow-lg transition-colors hover:border-slate-600">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-slate-400">{label}</h2>
        <span className={`${accent} opacity-70`} aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <p className={`text-4xl font-bold tracking-tight tabular-nums ${display ? accent : "text-slate-500"}`}>
          {display ? display.value : emptyText}
        </p>
        {display && <span className="text-sm font-medium text-slate-500">{display.unit}</span>}
      </div>
      {reading === null && showFailure && <p className="mt-2 text-xs text-yellow-400/80">Falha na leitura</p>}
      {caption && <p className="mt-2 text-xs text-slate-500">{caption}</p>}
    </section>
  );
}
