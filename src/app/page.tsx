import Image from "next/image";
import Link from "next/link";
import PublicRefresh from "@/components/PublicRefresh";
import { getCoLevel, isSimulation, parseReading } from "@/lib/co";
import { fetchFeeds } from "@/lib/thingspeak";

// Painel público (cidadão). Sempre renderiza no momento da requisição: dados em tempo real.
export const dynamic = "force-dynamic";

// Sem leitura nova há mais que isso, avisamos que os dados podem estar desatualizados.
const STALE_THRESHOLD_MS = 5 * 60_000;

// Enquanto o MQ-7 não estiver calibrado (R0 definido em ar limpo), o semáforo do CO fica pausado
// para não alarmar o público com leituras inválidas. Para ativar: CO_CALIBRADO=true (e Redeploy).
const CO_CALIBRADO = process.env.CO_CALIBRADO?.trim().toLowerCase() === "true";

interface PublicStatus {
  title: string;
  message: string;
  card: string; // fundo + texto do card principal
  badge: string; // selo do valor em ppm
}

// Traduz as faixas técnicas de getCoLevel (co.ts) para a linguagem do cidadão.
const STATUS_BY_LEVEL: Record<string, PublicStatus> = {
  Normal: {
    title: "Qualidade Boa",
    message: "Os níveis de monóxido de carbono estão dentro do limite recomendado. O ar está adequado para quem espera no ponto.",
    card: "bg-green-600 text-white",
    badge: "bg-white/20 text-white",
  },
  Atenção: {
    title: "Atenção",
    message:
      "Os níveis estão acima do recomendado para exposição prolongada. Pessoas sensíveis devem evitar ficar muito tempo junto à via.",
    card: "bg-yellow-400 text-yellow-950",
    badge: "bg-yellow-950/10 text-yellow-950",
  },
  Risco: {
    title: "Risco Moderado",
    message:
      "Os níveis estão elevados. Evite permanecer muito tempo perto da pista. Crianças, idosos, gestantes e pessoas com doenças do coração devem se afastar.",
    card: "bg-orange-500 text-white",
    badge: "bg-white/20 text-white",
  },
  Perigo: {
    title: "Perigo",
    message:
      "Os níveis estão muito altos. Se puder, afaste-se da via. Se sentir dor de cabeça, tontura ou enjoo, procure um local arejado.",
    card: "bg-red-600 text-white",
    badge: "bg-white/20 text-white",
  },
};

const SIMULATION_STATUS: PublicStatus = {
  title: "Modo de Demonstração",
  message: "O sensor está em um teste de demonstração neste momento. A próxima leitura real aparecerá em instantes.",
  card: "bg-purple-600 text-white",
  badge: "bg-white/20 text-white",
};

const CALIBRATION_STATUS: PublicStatus = {
  title: "Sensor em calibração",
  message:
    "Estamos ajustando o sensor de monóxido de carbono para garantir leituras confiáveis. Enquanto isso, o indicador de qualidade do ar fica pausado. Temperatura e umidade seguem sendo medidas normalmente.",
  card: "bg-sky-700 text-white",
  badge: "bg-white/20 text-white",
};

const NO_DATA_STATUS: PublicStatus = {
  title: "Sem leitura no momento",
  message: "Não recebemos uma medição válida do sensor agora. Tente novamente em alguns minutos.",
  card: "bg-gray-200 text-gray-800",
  badge: "bg-gray-900/10 text-gray-800",
};

const SCALE = [
  { label: "Qualidade Boa", range: "0 a 9 ppm", dot: "bg-green-600" },
  { label: "Atenção", range: "10 a 35 ppm", dot: "bg-yellow-400" },
  { label: "Risco Moderado", range: "36 a 100 ppm", dot: "bg-orange-500" },
  { label: "Perigo", range: "acima de 100 ppm", dot: "bg-red-600" },
];

const formatNumber = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString("pt-BR", {
    timeZone: "America/Manaus",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

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

export default async function HomePage() {
  const { latest, fetchedAt } = await getLatestReading();

  const co = parseReading(latest?.field1);
  const temp = parseReading(latest?.field2);
  const hum = parseReading(latest?.field3);

  const simulation = co !== null && isSimulation(co);
  const status = !CO_CALIBRADO
    ? CALIBRATION_STATUS
    : co === null
      ? NO_DATA_STATUS
      : simulation
        ? SIMULATION_STATUS
        : STATUS_BY_LEVEL[getCoLevel(co).label];
  const ageMs = latest ? fetchedAt - new Date(latest.created_at).getTime() : Infinity;
  const isStale = ageMs > STALE_THRESHOLD_MS;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <PublicRefresh />

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Image src="/logo.png.jpeg" alt="Logo ARSENS" width={40} height={40} className="rounded-md object-contain" />
            <div className="min-w-0">
              <p className="text-lg leading-tight font-bold tracking-wide text-gray-900">ARSENS</p>
              <p className="truncate text-xs text-gray-500">Qualidade do ar · Av. Djalma Batista</p>
            </div>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
              isStale ? "bg-gray-100 text-gray-600" : "bg-green-50 text-green-700"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${isStale ? "bg-gray-400" : "animate-pulse bg-green-500"}`} />
            {isStale ? "Sem sinal recente" : "Ao vivo"}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Como está o ar agora?</h1>
          <p className="mt-1 text-gray-600">
            Monóxido de carbono medido em tempo real na parada de ônibus da Av. Djalma Batista, em Manaus.
          </p>
        </div>

        {/* Status do CO: o foco é a mensagem; o valor em ppm fica em segundo plano */}
        <section aria-live="polite" className={`rounded-3xl p-6 shadow-sm sm:p-8 ${status.card}`}>
          <p className="text-sm font-medium opacity-80">Monóxido de carbono (CO)</p>
          <h2 className="mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">{status.title}</h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed opacity-95 sm:text-lg">{status.message}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {CO_CALIBRADO && co !== null && !simulation && (
              <span className={`rounded-full px-3 py-1 font-medium tabular-nums ${status.badge}`}>
                {formatNumber(co)} ppm
              </span>
            )}
            {latest && <span className="opacity-80">Medido em {formatDateTime(latest.created_at)}</span>}
          </div>
        </section>

        {isStale && latest && (
          <p className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
            ⚠️ O sensor não envia dados {formatAge(ageMs)}. As informações acima podem estar desatualizadas.
          </p>
        )}

        {/* Clima */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Temperatura</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {temp !== null ? formatNumber(temp) : "—"}
              <span className="ml-1 text-base font-medium text-gray-500">°C</span>
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Umidade do ar</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {hum !== null ? formatNumber(hum) : "—"}
              <span className="ml-1 text-base font-medium text-gray-500">%</span>
            </p>
          </div>
        </div>

        {/* Escala de referência */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Como ler o indicador</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {SCALE.map((s) => (
              <li key={s.label} className="flex items-center gap-3 text-sm">
                <span className={`h-3 w-3 shrink-0 rounded-full ${s.dot}`} />
                <span className="font-medium">{s.label}</span>
                <span className="text-gray-500">{s.range}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Contexto local */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">📍 Onde fica o sensor</h2>
          <div className="mt-3 space-y-3 leading-relaxed text-gray-700">
            <p>
              O sensor está instalado na <strong>Avenida Djalma Batista</strong>, exatamente na parada de ônibus em frente
              ao <strong>Millennium Shopping</strong> e ao lado da <strong>Uninorte</strong> — um dos trechos de maior
              movimento de Manaus.
            </p>
            <p>
              Ali passam muitas linhas de ônibus e outros veículos pesados. Cada vez que um ônibus para, arranca ou fica
              com o motor ligado no ponto, ele libera gases de escapamento, incluindo o monóxido de carbono, bem na altura
              de quem está na calçada. Por isso, <strong>pedestres e estudantes que esperam no ponto</strong> respiram
              diretamente o ar mais afetado pelo trânsito, e o nível de CO pode mudar bastante ao longo do dia,
              acompanhando o fluxo de veículos.
            </p>
          </div>
          <a
            href="https://www.openstreetmap.org/?mlat=-3.10042&mlon=-60.02397#map=18/-3.10042/-60.02397"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium text-green-700 hover:underline"
          >
            Ver o local no mapa ↗
          </a>
        </section>

        {/* Bloco educativo */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">🫁 O que é o monóxido de carbono?</h2>
          <div className="mt-3 space-y-3 leading-relaxed text-gray-700">
            <p>
              O monóxido de carbono (CO) é chamado de <strong>&quot;assassino invisível&quot;</strong>: é um gás sem cor e
              sem cheiro, impossível de perceber sem um sensor. Nas cidades, a maior parte dele vem do escapamento de
              carros, ônibus e caminhões.
            </p>
            <p>
              Quando respiramos CO, ele reduz a quantidade de oxigênio que o sangue leva ao coração e ao cérebro. Isso pode
              causar <strong>dor de cabeça, tontura, cansaço e enjoo</strong>, e em concentrações muito altas, confusão e
              desmaio. Pessoas com doenças do coração, crianças, idosos e gestantes são as mais sensíveis.
            </p>
            <p>
              A <strong>EPA</strong> (Agência de Proteção Ambiental dos EUA) adota como limite 9 ppm em média de 8 horas e
              35 ppm em média de 1 hora, que são a base da escala acima. A <strong>OMS</strong> (Organização Mundial da
              Saúde) também inclui o CO nas suas diretrizes de qualidade do ar.
            </p>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Fontes:{" "}
            <a
              href="https://www.epa.gov/co-pollution/basic-information-about-carbon-monoxide-co-outdoor-air-pollution"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700"
            >
              EPA — Basic Information about Carbon Monoxide
            </a>{" "}
            ·{" "}
            <a
              href="https://www.who.int/publications/i/item/9789240034228"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700"
            >
              OMS — Diretrizes Globais de Qualidade do Ar (2021)
            </a>
          </p>
        </section>

        <p className="text-center text-xs leading-relaxed text-gray-500">
          Projeto acadêmico ARSENS · sensores ESP32, MQ-7 e BME280. As medições são indicativas e não substituem
          estações oficiais de monitoramento. A página se atualiza sozinha a cada 15 segundos.
        </p>

        {/* Acesso ao painel técnico */}
        <div className="pb-4 text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 15l4-4 3 3 5-6" />
            </svg>
            Acesso para Pesquisadores (Painel Técnico)
          </Link>
        </div>
      </main>
    </div>
  );
}
