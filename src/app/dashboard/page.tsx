import Link from "next/link";
import ChartComponent from "@/components/ChartComponent";
import CoCard from "@/components/CoCard";
import HistoryTable from "@/components/HistoryTable";
import Icon from "@/components/Icon";
import LocationMap, { LAT, LON } from "@/components/LocationMap";
import MetricCard from "@/components/MetricCard";
import RefreshButton from "@/components/RefreshButton";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { isSimulation, parseReading } from "@/lib/co";
import { formatRs } from "@/lib/feed";
import { getDashboardData } from "@/lib/thingspeak";

// Sempre renderiza no momento da requisição (dados em tempo real, sem pré-renderização no build).
export const dynamic = "force-dynamic";

// Sem leitura nova há mais que isso, o status muda de "Ao vivo" para "Sem sinal".
const LIVE_THRESHOLD_MS = 5 * 60_000;

// Mesma chave do painel público: aqui o valor de CO continua visível, só sinalizamos a calibração.
const CO_CALIBRADO = process.env.CO_CALIBRADO?.trim().toLowerCase() === "true";

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
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader active="tecnico" />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-card">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-500 text-white">
              <Icon name="cloudOff" className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-xl font-bold text-slate-900">Erro ao carregar dados do ThingSpeak</h1>
            <p className="mt-2 text-slate-600">Verifique a conexão e tente novamente em instantes.</p>
            <Link
              href="/"
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-strong"
            >
              <Icon name="home" className="h-4 w-4" />
              Voltar ao Modo Simples
            </Link>
          </div>
        </main>
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
  const isLive = ageMs < LIVE_THRESHOLD_MS;

  return (
    <div className="flex min-h-screen flex-col bg-background text-slate-900">
      <SiteHeader active="tecnico" live={{ isLive, lastSeen: latest ? formatAge(ageMs) : "sem dados" }} />

      {/* Faixa de título do painel técnico */}
      <div className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300">
              <Icon name="flask" className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Painel Técnico de Telemetria</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-slate-300">
                <Icon name="mapPin" className="h-4 w-4 text-teal-300" />
                Av. Djalma Batista · Coord. {LAT}, {LON} (Millennium / Uninorte)
              </p>
              <p className="mt-2 inline-flex items-center gap-2 text-xs font-bold tracking-[0.08em] text-teal-300 uppercase">
                <span className={`h-2 w-2 rounded-full ${isLive ? "animate-pulse bg-teal-400" : "bg-slate-500"}`} />
                {latest ? `Última leitura em ${formatDateTime(latest.created_at)}` : "Sem leituras"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20"
            >
              <Icon name="home" className="h-4 w-4" />
              Voltar ao Modo Simples
            </Link>
            <RefreshButton variant="onDark" />
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 lg:px-8 lg:py-8">
        {/* 1. Métricas principais */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CoCard
            value={latest?.field1}
            previous={previousCo}
            updatedAt={latest ? formatDateTime(latest.created_at) : null}
            calibrated={CO_CALIBRADO}
          />
          <MetricCard
            eyebrow="BME280"
            label="Temperatura ambiente"
            value={latest?.field2}
            unit="°C"
            icon="thermometer"
            tone="bg-orange-50 text-orange-600"
          />
          <MetricCard
            eyebrow="BME280"
            label="Umidade relativa"
            value={latest?.field3}
            unit="%"
            icon="droplet"
            tone="bg-sky-50 text-sky-600"
          />
          <MetricCard
            eyebrow="MQ-7 · diagnóstico"
            label="Resistência do Sensor (Rs)"
            value={latest?.rs}
            unit="Ω"
            icon="activity"
            tone="bg-slate-100 text-slate-600"
            format={formatRs}
            caption="Dado bruto do MQ-7 (diagnóstico)"
            emptyText="—"
            showFailure={false} // leituras antigas não têm Rs: ausência não é falha
          />
        </div>

        {/* 2. Gráfico 24 h + ponto de coleta */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ChartComponent data={chart} />
          <section className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-lg font-bold tracking-tight">Ponto de coleta</h2>
            <p className="text-sm text-slate-500">Parada de ônibus Atlantic Tower C/B · via de alto tráfego</p>
            <LocationMap className="mt-4 h-64 lg:h-auto lg:flex-1" />
          </section>
        </div>

        {/* 3. Histórico + exportação */}
        <HistoryTable feeds={feeds} />
      </main>

      <SiteFooter />
    </div>
  );
}
