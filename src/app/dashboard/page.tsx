import { logout } from "@/app/actions";
import ChartComponent from "@/components/ChartComponent";
import CoCard from "@/components/CoCard";
import DashboardHeader from "@/components/DashboardHeader";
import HistoryTable from "@/components/HistoryTable";
import LocationMap from "@/components/LocationMap";
import MetricCard from "@/components/MetricCard";
import { isSimulation, parseReading } from "@/lib/co";
import { getDashboardData } from "@/lib/thingspeak";

// Sempre renderiza no momento da requisição (dados em tempo real, sem pré-renderização no build).
export const dynamic = "force-dynamic";

// Sem leitura nova há mais que isso, o status muda de "Ao vivo" para "Offline".
const LIVE_THRESHOLD_MS = 5 * 60_000;

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString("pt-BR", { timeZone: "America/Manaus" });

const formatAge = (ms: number) => {
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  return h < 24 ? `há ${h} h` : `há ${Math.floor(h / 24)} d`;
};

export default async function DashboardPage() {
  const { feeds, chart, fetchedAt } = await getDashboardData();

  if (!feeds) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 text-white">
        <h1 className="text-xl">Erro ao carregar dados do ThingSpeak.</h1>
        <p className="text-slate-400">Verifique suas credenciais e conexão.</p>
        <form action={logout}>
          <button className="rounded-lg bg-red-600 px-4 py-2 hover:bg-red-700">Sair</button>
        </form>
      </div>
    );
  }

  const latest = feeds[0];

  // Leitura válida anterior à atual, para a seta de tendência do CO.
  const previousCo =
    feeds
      .slice(1)
      .map((f) => parseReading(f.field1))
      .find((v): v is number => v !== null && !isSimulation(v)) ?? null;

  const ageMs = latest ? fetchedAt - new Date(latest.created_at).getTime() : Infinity;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-cyan-500/30">
      <DashboardHeader isLive={ageMs < LIVE_THRESHOLD_MS} lastSeen={latest ? formatAge(ageMs) : "sem dados"} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Qualidade do ar em tempo real</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monóxido de carbono, temperatura e umidade na Av. Djalma Batista · sensores MQ-7 e BME280
          </p>
        </div>

        {/* 1. Métricas principais */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CoCard
            value={latest?.field1}
            previous={previousCo}
            updatedAt={latest ? formatDateTime(latest.created_at) : null}
          />
          <MetricCard
            label="Temperatura"
            value={latest?.field2}
            unit="°C"
            accent="text-pink-400"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 14.76V4a2 2 0 1 0-4 0v10.76a4 4 0 1 0 4 0z" />
              </svg>
            }
          />
          <MetricCard
            label="Umidade"
            value={latest?.field3}
            unit="%"
            accent="text-indigo-400"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
              </svg>
            }
          />
        </div>

        {/* 2. Gráfico 24 h + mapa */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ChartComponent data={chart} />
          <LocationMap />
        </div>

        {/* 3. Histórico + exportação */}
        <HistoryTable feeds={feeds} />
      </main>
    </div>
  );
}
