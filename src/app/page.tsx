import Link from "next/link";
import Icon from "@/components/Icon";
import LocationMap from "@/components/LocationMap";
import RefreshButton from "@/components/RefreshButton";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { isSimulation, parseReading } from "@/lib/co";
import { coStatusKey, SCALE_KEYS, STATUS, type StatusKey } from "@/lib/status-style";
import { fetchFeeds } from "@/lib/thingspeak";

// Painel público (cidadão). Sempre renderiza no momento da requisição: dados em tempo real.
export const dynamic = "force-dynamic";

// Sem leitura nova há mais que isso, avisamos que os dados podem estar desatualizados.
const STALE_THRESHOLD_MS = 5 * 60_000;

// Enquanto o MQ-7 não estiver calibrado (R0 definido em ar limpo), o semáforo do CO fica pausado
// para não alarmar o público com leituras inválidas. Para ativar: CO_CALIBRADO=true (e Redeploy).
const CO_CALIBRADO = process.env.CO_CALIBRADO?.trim().toLowerCase() === "true";

const TELEGRAM_URL = process.env.TELEGRAM_BOT_URL ?? "#";

// Descrição curta de cada faixa na régua "Como ler o indicador".
const SCALE_TEXT: Record<(typeof SCALE_KEYS)[number], string> = {
  boa: "Sem restrições. Condição adequada para esperar o ônibus ou caminhar.",
  atencao: "Pessoas sensíveis devem evitar ficar muito tempo junto à via.",
  risco: "Dor de cabeça e cansaço podem surgir com exposição contínua.",
  perigo: "Afaste-se do local e procure um ambiente arejado.",
};

// Texto do card lateral do herói quando o valor de CO não é exibido.
const HIDDEN_VALUE_NOTE: Partial<Record<StatusKey, string>> = {
  calibracao: "O valor volta a aparecer quando a calibração do sensor terminar.",
  demo: "Leitura de teste, acionada pelo botão de demonstração do sensor.",
  semDados: "Aguardando a próxima medição válida do sensor.",
};

const SYMPTOMS = ["Dor de cabeça", "Tontura", "Cansaço", "Enjoo"];

const formatNumber = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const formatTime = (dateString: string) =>
  new Date(dateString).toLocaleTimeString("pt-BR", { timeZone: "America/Manaus", hour: "2-digit", minute: "2-digit" });

const formatAge = (ms: number) => {
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  return h < 24 ? `há ${h} h` : `há ${Math.floor(h / 24)} dia(s)`;
};

// O cidadão só precisa da leitura mais recente: buscar 1 resultado mantém a página leve
// (ela se atualiza a cada 15 s para cada visitante).
async function getLatestReading() {
  const feeds = await fetchFeeds({ results: "1" });
  return { latest: feeds?.[0] ?? null, fetchedAt: Date.now() };
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold tracking-[0.08em] text-brand-strong dark:text-teal-300 uppercase">{children}</p>;
}

function SectionIcon({ name }: { name: Parameters<typeof Icon>[0]["name"] }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-500/10 text-brand-strong dark:text-teal-300">
      <Icon name={name} className="h-5 w-5" />
    </span>
  );
}

export default async function HomePage() {
  const { latest, fetchedAt } = await getLatestReading();

  const co = parseReading(latest?.field1);
  const temp = parseReading(latest?.field2);
  const hum = parseReading(latest?.field3);

  const key: StatusKey = CO_CALIBRADO ? coStatusKey(co) : "calibracao";
  const status = STATUS[key];
  const showValue = CO_CALIBRADO && co !== null && !isSimulation(co);

  const ageMs = latest ? fetchedAt - new Date(latest.created_at).getTime() : Infinity;
  const isStale = ageMs > STALE_THRESHOLD_MS;
  const lastSeen = latest ? formatAge(ageMs) : "sem dados";

  return (
    <div className="flex min-h-screen flex-col bg-background text-slate-900 dark:text-slate-50">
      <SiteHeader active="cidadao" live={{ isLive: !isStale, lastSeen }} />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 lg:space-y-8 lg:px-8 lg:py-8">
        {/* Abertura */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.08em] text-brand-strong dark:text-teal-300 uppercase">
              <span className="h-2 w-2 rounded-full bg-brand" />
              Monitoramento cidadão do ar · Manaus
            </p>
            <h1 className="text-[26px] leading-8 font-extrabold tracking-tight sm:text-4xl sm:leading-[44px]">
              Como está o ar agora?
            </h1>
            <p className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="bus" className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              Parada de ônibus da Av. Djalma Batista, em frente ao Millennium Shopping e ao lado da Uninorte
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-card lg:self-auto">
            <span
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${
                isStale ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" : "bg-teal-50 dark:bg-teal-500/10 text-teal-800 dark:text-teal-200"
              }`}
            >
              <Icon name="clock" className="h-4 w-4" />
              {latest ? `Medido às ${formatTime(latest.created_at)} (${lastSeen})` : "Sem medições"}
            </span>
            <RefreshButton />
          </div>
        </div>

        {/* Card-herói: o status é o foco; o valor em ppm fica em segundo plano */}
        <section
          aria-live="polite"
          className={`grid gap-5 rounded-3xl border p-5 shadow-card sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center ${status.soft}`}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <span
              className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl shadow-raised sm:h-24 sm:w-24 ${status.solid} ${
                key === "perigo" ? "animate-pulse" : ""
              }`}
            >
              <Icon name={status.icon} className="h-10 w-10 sm:h-12 sm:w-12" />
            </span>
            <div className="space-y-2">
              <span className="inline-flex rounded-full bg-white/80 dark:bg-slate-950/40 px-3 py-1 text-xs font-bold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
                Monóxido de carbono (CO)
              </span>
              <h2 className={`text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl ${status.text}`}>
                {status.label}
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-slate-700 dark:text-slate-300 sm:text-lg">{status.advice}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card lg:min-w-72">
            <p className="text-xs font-bold tracking-[0.08em] text-slate-500 dark:text-slate-400 uppercase">Concentração atual de CO</p>
            {showValue && co !== null ? (
              <>
                <p className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-5xl font-extrabold tracking-tight tabular-nums">{formatNumber(co)}</span>
                  <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">ppm</span>
                </p>
                {latest && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                    <Icon name="checkCircle" className="h-4 w-4 text-brand" />
                    Medido às {formatTime(latest.created_at)}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mt-2 text-5xl font-extrabold tracking-tight text-slate-300 dark:text-slate-600">—</p>
                <p className="mt-1 max-w-64 text-sm text-slate-600 dark:text-slate-400">{HIDDEN_VALUE_NOTE[key]}</p>
              </>
            )}
            <p className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3 text-xs text-slate-500 dark:text-slate-400">
              Referência EPA: até <strong className="text-slate-700 dark:text-slate-300">9 ppm</strong> em média de 8 horas
            </p>
          </div>
        </section>

        {isStale && latest && (
          <p className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 shadow-card">
            <Icon name="cloudOff" className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />O sensor não envia dados {lastSeen}.
            As informações acima podem estar desatualizadas.
          </p>
        )}

        {/* Métricas do ambiente */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricTile
            label="Temperatura"
            icon="thermometer"
            value={temp !== null ? formatNumber(temp) : "—"}
            unit="°C"
            note="Medida pelo sensor BME280"
          />
          <MetricTile
            label="Umidade do ar"
            icon="droplet"
            value={hum !== null ? formatNumber(hum) : "—"}
            unit="%"
            note="Umidade relativa do ar"
          />
          <MetricTile
            label="Situação do sensor"
            icon="activity"
            value={isStale ? "Sem sinal" : "Ao vivo"}
            note={latest ? `Última leitura às ${formatTime(latest.created_at)} · atualiza a cada 15 s` : "Nenhuma leitura recebida"}
            valueClass={isStale ? "text-slate-500 dark:text-slate-400" : "text-brand-strong dark:text-teal-300"}
          />
        </div>

        {/* Escala educativa */}
        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card sm:p-8">
          <Eyebrow>Escala educativa</Eyebrow>
          <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Como ler o indicador de monóxido de carbono</h2>
          <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">
            Quanto menor a concentração em ppm (partes por milhão), mais limpo está o ar no ponto de ônibus. As faixas
            seguem os limites de referência da EPA.
          </p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SCALE_KEYS.map((k) => {
              const s = STATUS[k];
              const current = CO_CALIBRADO && k === key;
              return (
                <li
                  key={k}
                  className={`relative rounded-2xl border p-4 ${current ? `${s.soft} ring-2 ring-offset-2 ring-slate-900/10 dark:ring-white/10` : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"}`}
                >
                  {current && (
                    <span className="absolute -top-3 left-4 rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase dark:bg-slate-100 dark:text-slate-900">
                      Nível atual
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold">{s.label}</p>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full ${s.solid}`}>
                      <Icon name={s.icon} className="h-4 w-4" />
                    </span>
                  </div>
                  <p className={`mt-1 text-sm font-bold ${s.text}`}>{s.range}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{SCALE_TEXT[k]}</p>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 flex h-2.5 overflow-hidden rounded-full" aria-hidden="true">
            {SCALE_KEYS.map((k) => (
              <span key={k} className={`flex-1 ${STATUS[k].dot}`} />
            ))}
          </div>
        </section>

        {/* Saúde + localização */}
        <div className="grid gap-6 lg:grid-cols-12">
          <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card sm:p-8 lg:col-span-7">
            <div className="flex items-center gap-3">
              <SectionIcon name="shield" />
              <div>
                <Eyebrow>Saúde coletiva</Eyebrow>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">O que é o monóxido de carbono?</h2>
              </div>
            </div>
            <div className="mt-4 space-y-3 leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                O monóxido de carbono (CO) é chamado de <strong>&quot;assassino invisível&quot;</strong>: é um gás sem cor
                e sem cheiro, impossível de perceber sem um sensor. Nas cidades, a maior parte dele vem do escapamento de
                carros, ônibus e caminhões.
              </p>
              <p>
                Quando respiramos CO, ele reduz a quantidade de oxigênio que o sangue leva ao coração e ao cérebro. Em
                concentrações muito altas, pode causar confusão e desmaio.
              </p>
            </div>

            <p className="mt-5 text-xs font-bold tracking-[0.08em] text-slate-500 dark:text-slate-400 uppercase">Sintomas comuns da exposição</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => (
                <li
                  key={s}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  <Icon name="alertCircle" className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  {s}
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-2xl bg-teal-50 dark:bg-teal-500/10 p-4">
              <p className="flex items-center gap-2 font-semibold text-teal-900 dark:text-teal-100">
                <Icon name="users" className="h-5 w-5" />
                Quem merece mais atenção no ponto de ônibus
              </p>
              <p className="mt-1 text-sm leading-relaxed text-teal-900/80 dark:text-teal-100/80">
                Crianças, idosos, gestantes e pessoas com doenças do coração são as mais sensíveis ao CO. Em horários de
                trânsito intenso, prefira esperar um pouco mais afastado do meio-fio.
              </p>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              A <strong>EPA</strong> (Agência de Proteção Ambiental dos EUA) adota como limite 9 ppm em média de 8 horas e
              35 ppm em média de 1 hora, base da escala acima. A <strong>OMS</strong> também inclui o CO nas suas
              diretrizes de qualidade do ar.
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="text-xs font-bold tracking-[0.08em] text-slate-500 dark:text-slate-400 uppercase">Fontes</span>
              <a
                href="https://www.epa.gov/co-pollution/basic-information-about-carbon-monoxide-co-outdoor-air-pollution"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-1 font-semibold text-brand-strong dark:text-teal-300 hover:underline sm:min-h-0"
              >
                EPA — Carbon Monoxide <Icon name="externalLink" className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://www.who.int/publications/i/item/9789240034228"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-1 font-semibold text-brand-strong dark:text-teal-300 hover:underline sm:min-h-0"
              >
                OMS — Diretrizes de Qualidade do Ar (2021) <Icon name="externalLink" className="h-3.5 w-3.5" />
              </a>
            </p>
          </section>

          <section className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card sm:p-8 lg:col-span-5">
            <div className="flex items-center gap-3">
              <SectionIcon name="mapPin" />
              <div>
                <Eyebrow>Localização</Eyebrow>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Onde fica este sensor?</h2>
              </div>
            </div>
            <div className="mt-4 space-y-3 leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Na <strong>Avenida Djalma Batista</strong>, exatamente na parada de ônibus em frente ao{" "}
                <strong>Millennium Shopping</strong> e ao lado da <strong>Uninorte</strong>, um dos trechos de maior
                movimento de Manaus.
              </p>
              <p>
                Cada vez que um ônibus para, arranca ou fica com o motor ligado no ponto, libera gases de escapamento bem
                na altura de quem está na calçada. Por isso, <strong>pedestres e estudantes que esperam no ponto</strong>{" "}
                respiram diretamente o ar mais afetado pelo trânsito.
              </p>
            </div>
            <LocationMap className="mt-5 h-60 lg:flex-1" />
          </section>
        </div>

        {/* Ações */}
        <section className="flex flex-col gap-5 rounded-3xl border border-teal-100 dark:border-teal-500/20 bg-teal-50/60 dark:bg-teal-500/5 p-5 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <SectionIcon name="flask" />
            <div>
              <p className="font-semibold">Dados abertos para pesquisa</p>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                O painel técnico mostra o histórico de 24 horas, a tabela de leituras e permite baixar os dados em planilha
                (.xlsx) ou CSV. A página se atualiza sozinha a cada 15 segundos.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <a
              href={TELEGRAM_URL}
              target={TELEGRAM_URL === "#" ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-brand-strong dark:border-teal-400 bg-white dark:bg-slate-900 px-5 text-sm font-semibold text-brand-strong dark:text-teal-300 transition-colors hover:bg-teal-50 dark:hover:bg-teal-500/10"
            >
              <Icon name="send" className="h-4 w-4" />
              Receber alertas no Telegram
            </a>
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand-strong px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/30 active:scale-[0.98]"
            >
              <Icon name="chart" className="h-4 w-4" />
              Acesso para Pesquisadores (Painel Técnico)
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function MetricTile({
  label,
  icon,
  value,
  unit,
  note,
  valueClass = "text-slate-900 dark:text-slate-50",
}: {
  label: string;
  icon: Parameters<typeof Icon>[0]["name"];
  value: string;
  unit?: string;
  note: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold tracking-[0.08em] text-slate-500 dark:text-slate-400 uppercase">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className={`text-4xl font-extrabold tracking-tight tabular-nums ${valueClass}`}>{value}</span>
        {unit && <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">{unit}</span>}
      </p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{note}</p>
    </div>
  );
}
