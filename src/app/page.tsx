import Link from "next/link";
import Icon from "@/components/Icon";
import LocationMap from "@/components/LocationMap";
import MobileCollapsible from "@/components/MobileCollapsible";
import RefreshButton from "@/components/RefreshButton";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { isSimulation, parseReading } from "@/lib/co";
import { coStatusKey, SCALE_KEYS, STATUS, type StatusKey } from "@/lib/status-style";
import { fetchLatest } from "@/lib/thingspeak";

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

// O cidadão só precisa da leitura mais recente. Usa a mesma busca (com cache de 15 s) das
// "últimas 20" do painel técnico: os dois painéis dividem uma única consulta ao ThingSpeak.
async function getLatestReading() {
  const feeds = await fetchLatest(20);
  return { latest: feeds?.at(-1) ?? null, fetchedAt: Date.now() };
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

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-4 md:space-y-6 md:py-6 lg:space-y-8 lg:px-8 lg:py-8">
        {/* Abertura */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <p className="hidden items-center gap-2 text-xs font-bold tracking-[0.08em] text-brand-strong uppercase md:flex dark:text-teal-300">
              <span className="h-2 w-2 rounded-full bg-brand" />
              Monitoramento cidadão do ar · Manaus
            </p>
            <h1 className="text-[26px] leading-8 font-extrabold tracking-tight sm:text-4xl sm:leading-[44px]">
              Como está o ar agora?
            </h1>
            <p className="hidden items-start gap-2 text-slate-600 md:flex dark:text-slate-400">
              <Icon name="bus" className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              Parada de ônibus da Av. Djalma Batista, em frente ao Millennium Shopping e ao lado da Uninorte
            </p>
          </div>
          <div className="hidden flex-wrap items-center gap-2 self-start md:flex rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-card lg:self-auto">
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
          className={`grid gap-4 rounded-3xl border p-4 shadow-card sm:gap-5 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center ${status.soft}`}
        >
          <div className="flex flex-row items-start gap-4 sm:items-center sm:gap-5">
            <span
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-raised sm:h-24 sm:w-24 sm:rounded-3xl ${status.solid} ${
                key === "perigo" ? "animate-pulse" : ""
              }`}
            >
              <Icon name={status.icon} className="h-7 w-7 sm:h-12 sm:w-12" />
            </span>
            <div className="space-y-2">
              <span className="inline-flex rounded-full bg-white/80 dark:bg-slate-950/40 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-slate-700 dark:text-slate-300 uppercase sm:px-3 sm:py-1 sm:text-xs">
                Monóxido de carbono (CO)
              </span>
              {/* Só o nome do status é anunciado pelo leitor de tela quando muda (ex.: "Atenção").
                  O card inteiro não fica em aria-live porque tem o texto "(há X min)", que muda a
                  cada atualização e faria o card ser lido de novo o tempo todo. */}
              <h2
                aria-live="polite"
                aria-atomic="true"
                className={`text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl ${status.text}`}
              >
                {status.label}
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-slate-700 dark:text-slate-300 sm:text-lg">{status.advice}</p>
            </div>
          </div>

          {/* Celular: valor, hora e Atualizar numa linha dentro do card de status */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-900/10 pt-3 md:hidden dark:border-white/10">
            <div className="min-w-0 text-sm">
              {showValue && co !== null ? (
                <p className="font-semibold">
                  <span className="text-2xl font-extrabold tracking-tight tabular-nums">{formatNumber(co)}</span> ppm
                  <span className="ml-1 font-normal text-slate-600 dark:text-slate-400">(ref. EPA: 9 ppm)</span>
                </p>
              ) : (
                <p className="text-slate-700 dark:text-slate-300">{HIDDEN_VALUE_NOTE[key]}</p>
              )}
              {latest && (
                <p className="mt-0.5 flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                  <Icon name={isStale ? "cloudOff" : "clock"} className="mt-0.5 h-4 w-4 shrink-0" />
                  {/* No celular, o aviso de "sensor sem enviar" fica aqui, em vez de num bloco separado */}
                  {isStale
                    ? `Sem dados novos do sensor ${lastSeen} (última às ${formatTime(latest.created_at)})`
                    : `Medido às ${formatTime(latest.created_at)} (${lastSeen})`}
                </p>
              )}
            </div>
            <RefreshButton auto={false} />
          </div>

          <div className="hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card md:block lg:min-w-72">
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
          <p className="hidden items-start gap-3 md:flex rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 shadow-card">
            <Icon name="cloudOff" className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />O sensor não envia dados {lastSeen}.
            As informações acima podem estar desatualizadas.
          </p>
        )}

        {/* Métricas do ambiente */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <MetricTile
            label="Temperatura"
            short="Temp."
            icon="thermometer"
            value={temp !== null ? formatNumber(temp) : "—"}
            unit="°C"
            note="Medida pelo sensor BME280"
          />
          <MetricTile
            label="Umidade do ar"
            short="Umidade"
            icon="droplet"
            value={hum !== null ? formatNumber(hum) : "—"}
            unit="%"
            note="Umidade relativa do ar"
          />
          <MetricTile
            label="Situação do sensor"
            short="Sensor"
            icon="activity"
            value={isStale ? "Sem sinal" : "Ao vivo"}
            note={latest ? `Última leitura às ${formatTime(latest.created_at)} · atualiza a cada 15 s` : "Nenhuma leitura recebida"}
            valueClass={isStale ? "text-slate-500 dark:text-slate-400" : "text-brand-strong dark:text-teal-300"}
          />
        </div>

        {/* Escala educativa — celular: barra compacta com o nível atual e detalhes ao tocar */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card md:hidden dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold">Como ler o indicador</h2>
          <ol className="mt-3 grid grid-cols-4 gap-1.5">
            {SCALE_KEYS.map((k) => {
              const s = STATUS[k];
              const current = CO_CALIBRADO && k === key;
              return (
                <li key={k} className="text-center">
                  <span
                    className={`block h-2.5 rounded-full ${s.dot} ${current ? "ring-2 ring-slate-900 ring-offset-2 dark:ring-white dark:ring-offset-slate-900" : ""}`}
                  />
                  <span className={`mt-2 block text-[11px] leading-tight font-bold ${current ? s.text : ""}`}>{s.label}</span>
                  <span className="block text-[11px] leading-tight text-slate-500 dark:text-slate-400">{s.range}</span>
                  {current && <span className="sr-only">(nível atual)</span>}
                </li>
              );
            })}
          </ol>
          <details className="group mt-3 border-t border-slate-100 pt-1 dark:border-slate-800">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-brand-strong dark:text-teal-300 [&::-webkit-details-marker]:hidden">
              O que significa cada nível
              <Icon name="chevronDown" className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="space-y-3 pb-1">
              {SCALE_KEYS.map((k) => {
                const s = STATUS[k];
                return (
                  <li key={k} className="flex gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${s.solid}`}>
                      <Icon name={s.icon} className="h-4 w-4" />
                    </span>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      <strong className="text-slate-900 dark:text-slate-50">{s.label}</strong>{" "}
                      <span className={`font-semibold ${s.text}`}>({s.range})</span>: {SCALE_TEXT[k]}
                    </p>
                  </li>
                );
              })}
            </ul>
          </details>
        </section>

        {/* Escala educativa — versão completa (a partir de 768 px) */}
        <section className="hidden md:block rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card sm:p-8">
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

        {/* Saúde + localização — celular: seções que abrem com um toque (o mapa só carrega ao abrir) */}
        <div className="space-y-3 md:hidden">
          <MobileCollapsible icon="shield" eyebrow="Saúde coletiva" title="O que é o monóxido de carbono?">
            <div className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <CoExplainer />
            </div>
            <p className="mt-4 text-xs font-bold tracking-[0.08em] text-slate-500 uppercase dark:text-slate-400">Sintomas comuns da exposição</p>
            <SymptomList />
            <EpaReference />
          </MobileCollapsible>
          <MobileCollapsible icon="users" eyebrow="Ponto de ônibus" title="Quem merece mais atenção">
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{SENSITIVE_TEXT}</p>
          </MobileCollapsible>
          <MobileCollapsible icon="mapPin" eyebrow="Localização" title="Onde fica este sensor?">
            <div className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <LocationText />
            </div>
            <LocationMap className="mt-4 h-56" />
          </MobileCollapsible>
        </div>

        {/* Saúde + localização — versão completa (a partir de 768 px) */}
        <div className="hidden gap-6 md:grid lg:grid-cols-12">
          <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card sm:p-8 lg:col-span-7">
            <div className="flex items-center gap-3">
              <SectionIcon name="shield" />
              <div>
                <Eyebrow>Saúde coletiva</Eyebrow>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">O que é o monóxido de carbono?</h2>
              </div>
            </div>
            <div className="mt-4 space-y-3 leading-relaxed text-slate-700 dark:text-slate-300">
              <CoExplainer />
            </div>

            <p className="mt-5 text-xs font-bold tracking-[0.08em] text-slate-500 dark:text-slate-400 uppercase">Sintomas comuns da exposição</p>
            <SymptomList />

            <div className="mt-5 rounded-2xl bg-teal-50 dark:bg-teal-500/10 p-4">
              <p className="flex items-center gap-2 font-semibold text-teal-900 dark:text-teal-100">
                <Icon name="users" className="h-5 w-5" />
                Quem merece mais atenção no ponto de ônibus
              </p>
              <p className="mt-1 text-sm leading-relaxed text-teal-900/80 dark:text-teal-100/80">{SENSITIVE_TEXT}</p>
            </div>

            <EpaReference />
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
              <LocationText />
            </div>
            <LocationMap className="mt-5 h-60 lg:flex-1" />
          </section>
        </div>

        {/* Ações */}
        <section className="flex flex-col gap-4 rounded-3xl border border-teal-100 dark:border-teal-500/20 bg-teal-50/60 dark:bg-teal-500/5 p-4 sm:gap-5 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <SectionIcon name="flask" />
            <div>
              <p className="font-semibold">Dados abertos para pesquisa</p>
              <p className="mt-1 hidden max-w-2xl text-sm leading-relaxed text-slate-600 md:block dark:text-slate-400">
                O painel técnico mostra o histórico em gráfico (24 horas, semana, mês ou um intervalo de datas), a tabela de leituras e permite baixar os dados em planilha
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
  short,
  icon,
  value,
  unit,
  note,
  valueClass = "text-slate-900 dark:text-slate-50",
}: {
  label: string;
  short: string; // rótulo curto para o card pequeno do celular
  icon: Parameters<typeof Icon>[0]["name"];
  value: string;
  unit?: string;
  note: string;
  valueClass?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-card sm:rounded-3xl sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold tracking-[0.06em] text-slate-500 dark:text-slate-400 uppercase sm:text-xs sm:tracking-[0.08em]">
          <span className="sm:hidden">{short}</span>
          <span className="hidden sm:inline">{label}</span>
        </p>
        <span className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-1 sm:mt-3 sm:gap-1.5">
        <span className={`text-xl font-extrabold sm:text-4xl tracking-tight tabular-nums ${valueClass}`}>{value}</span>
        {unit && <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 sm:text-lg">{unit}</span>}
      </p>
      <p className="mt-2 hidden text-sm text-slate-500 sm:block dark:text-slate-400">{note}</p>
    </div>
  );
}

// --- Textos usados nas duas versões da página (celular e a partir de 768 px) ---

const SENSITIVE_TEXT =
  "Crianças, idosos, gestantes e pessoas com doenças do coração são as mais sensíveis ao CO. Em horários de trânsito intenso, prefira esperar um pouco mais afastado do meio-fio.";

function CoExplainer() {
  return (
    <>
      <p>
        O monóxido de carbono (CO) é chamado de <strong>&quot;assassino invisível&quot;</strong>: é um gás sem cor e sem
        cheiro, impossível de perceber sem um sensor. Nas cidades, a maior parte dele vem do escapamento de carros, ônibus
        e caminhões.
      </p>
      <p>
        Quando respiramos CO, ele reduz a quantidade de oxigênio que o sangue leva ao coração e ao cérebro. Em
        concentrações muito altas, pode causar confusão e desmaio.
      </p>
    </>
  );
}

function SymptomList() {
  return (
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
  );
}

function EpaReference() {
  return (
    <>
      <p className="mt-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        A <strong>EPA</strong> (Agência de Proteção Ambiental dos EUA) adota como limite 9 ppm em média de 8 horas e 35
        ppm em média de 1 hora, base da escala acima. A <strong>OMS</strong> também inclui o CO nas suas diretrizes de
        qualidade do ar.
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
    </>
  );
}

function LocationText() {
  return (
    <>
      <p>
        Na <strong>Avenida Djalma Batista</strong>, exatamente na parada de ônibus em frente ao{" "}
        <strong>Millennium Shopping</strong> e ao lado da <strong>Uninorte</strong>, um dos trechos de maior movimento de
        Manaus.
      </p>
      <p>
        Cada vez que um ônibus para, arranca ou fica com o motor ligado no ponto, libera gases de escapamento bem na altura
        de quem está na calçada. Por isso, <strong>pedestres e estudantes que esperam no ponto</strong> respiram
        diretamente o ar mais afetado pelo trânsito.
      </p>
    </>
  );
}
