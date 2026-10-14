import { parseReading } from "@/lib/co";

interface MetricCardProps {
  label: string;
  value: string | null | undefined;
  unit: string;
  accent: string; // classe de cor do texto do valor
  icon: React.ReactNode;
}

export default function MetricCard({ label, value, unit, accent, icon }: MetricCardProps) {
  const reading = parseReading(value);

  return (
    <section className="flex flex-col justify-between rounded-xl border border-slate-700 bg-slate-800 p-5 shadow-lg transition-colors hover:border-slate-600">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-400">{label}</h2>
        <span className={`${accent} opacity-70`} aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <p className={`text-4xl font-bold tracking-tight tabular-nums ${reading !== null ? accent : "text-slate-500"}`}>
          {reading !== null ? reading.toFixed(1) : "--"}
        </p>
        <span className="text-sm font-medium text-slate-500">{unit}</span>
      </div>
      {reading === null && <p className="mt-2 text-xs text-yellow-400/80">Falha na leitura</p>}
    </section>
  );
}
