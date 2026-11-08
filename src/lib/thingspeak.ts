import { unstable_cache } from "next/cache";
import { isSimulation, parseReading } from "./co";
import { parseRs, SESSION_GAP_MS, type ChartPoint, type Feed, type Session } from "./feed";
import { pickBucket, type ChartRange } from "./period";

interface ThingSpeakResponse {
  channel: {
    id: number;
    name: string;
    description: string;
  };
  feeds: Omit<Feed, "rs">[];
}

// Busca leituras do canal em ordem cronológica (mais antiga primeiro).
export async function fetchFeeds(params: Record<string, string>): Promise<Feed[] | null> {
  // trim(): evita falhas por espaços/quebras de linha coladas junto no painel da Vercel
  const channelId = process.env.THINGSPEAK_CHANNEL_ID?.trim();
  const apiKey = process.env.THINGSPEAK_READ_API_KEY?.trim();

  if (!channelId) {
    console.error("THINGSPEAK_CHANNEL_ID não configurado.");
    return null;
  }

  const query = new URLSearchParams(params);
  if (apiKey) query.set("api_key", apiKey);

  try {
    const res = await fetch(
      `https://api.thingspeak.com/channels/${channelId}/feeds.json?${query}`,
      { cache: "no-store" } // Garante que pegue os dados mais recentes sempre
    );

    if (!res.ok) {
      // Loga o status e o início da resposta (nunca a chave) para facilitar o diagnóstico
      const body = (await res.text()).slice(0, 200);
      throw new Error(
        `Falha ao buscar dados do ThingSpeak: HTTP ${res.status} (canal ${channelId}, ` +
          `read key ${apiKey ? `configurada, ${apiKey.length} caracteres` : "AUSENTE"}) — ${body}`
      );
    }

    const data: ThingSpeakResponse = await res.json();
    // field4 (Rs) vira número; leituras antigas sem o campo ficam com rs = null
    return data.feeds?.map((f) => ({ ...f, rs: parseRs(f.field4) })) ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Agrupa as leituras em janelas de `minutes` minutos (média), ignorando falhas
// do sensor e valores de simulação, para manter o gráfico leve e legível.
// Rs (diagnóstico) não entra nas médias.
export function bucketFeeds(feeds: Feed[], minutes = 10): ChartPoint[] {
  const size = minutes * 60_000;
  const buckets = new Map<number, { co: number[]; temp: number[]; hum: number[] }>();

  for (const feed of feeds) {
    const key = Math.floor(new Date(feed.created_at).getTime() / size);
    const bucket = buckets.get(key) ?? { co: [], temp: [], hum: [] };
    const co = parseReading(feed.field1);
    const temp = parseReading(feed.field2);
    const hum = parseReading(feed.field3);
    if (co !== null && !isSimulation(co)) bucket.co.push(co);
    if (temp !== null) bucket.temp.push(temp);
    if (hum !== null) bucket.hum.push(hum);
    buckets.set(key, bucket);
  }

  const avg = (values: number[]) =>
    values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : null;

  const keys = [...buckets.keys()];
  if (keys.length === 0) return [];

  // Percorre todas as janelas do período: janelas sem leitura viram null,
  // assim o gráfico mostra a lacuna em vez de ligar pontos distantes.
  const points: ChartPoint[] = [];
  for (let key = Math.min(...keys); key <= Math.max(...keys); key++) {
    const b = buckets.get(key);
    points.push({
      ts: key * size + size / 2,
      co: b ? avg(b.co) : null,
      temp: b ? avg(b.temp) : null,
      hum: b ? avg(b.hum) : null,
    });
  }
  return points;
}

// ================== CACHE ==================
// Sem cache, cada visitante faria suas próprias consultas ao ThingSpeak a cada 15 s (e um
// período de 90 dias, dezenas delas). Com o cache do Next (compartilhado entre todos os
// visitantes e, na Vercel, entre as instâncias do servidor), o ThingSpeak recebe no máximo
// uma consulta por chave a cada intervalo, não importa quantas pessoas estejam com o site
// aberto.
//
// unstable_cache foi substituído pela diretiva "use cache" no Next 16, mas ela exige ligar
// o modo Cache Components (que remove o `export const dynamic` das páginas). No modelo de
// cache que o projeto usa, unstable_cache continua sendo o caminho para funções que não são
// um fetch simples. Ele é ignorado se for chamado dentro de outro unstable_cache: não aninhe.

// Leituras recentes (cards, tabela, painel público): até 15 s
const TTL_RECENTES = 15;
// Dia em andamento no gráfico: até 30 s
const TTL_DIA_ABERTO = 30;
// Dias que já terminaram não recebem leituras novas: 1 dia (renovado só por segurança)
const TTL_DIA_FECHADO = 24 * 60 * 60;
// Download do histórico (8.000 leituras): até 60 s
const TTL_EXPORTACAO = 60;

// Executa `load` com cache. Falhas (null) NÃO são guardadas: o erro é lançado dentro da
// função cacheada (o Next não guarda exceções) e vira null aqui fora.
async function cached<T>(key: string[], ttl: number, load: () => Promise<T | null>): Promise<T | null> {
  try {
    const run = unstable_cache(
      async () => {
        const value = await load();
        if (value === null) throw new Error("ThingSpeak indisponível");
        return value;
      },
      ["thingspeak", ...key],
      { revalidate: ttl }
    );
    return await run();
  } catch {
    return null;
  }
}

// Últimas `n` leituras (ordem cronológica). Painel público e técnico usam a MESMA chave
// (20 leituras), então dividem o cache.
export function fetchLatest(n = 20): Promise<Feed[] | null> {
  return cached(["recentes", String(n)], TTL_RECENTES, () => fetchFeeds({ results: String(n) }));
}

// Últimas 8.000 leituras, para o download do histórico
export function fetchForExport(): Promise<Feed[] | null> {
  return cached(["exportacao"], TTL_EXPORTACAO, () => fetchFeeds({ results: String(MAX_RESULTS) }));
}

// O ThingSpeak devolve no máximo 8.000 leituras por consulta (as mais recentes da janela).
const MAX_RESULTS = 8000;
// O gráfico busca por DIA (UTC): os limites ficam fixos, então a mesma consulta serve para
// qualquer período e qualquer visitante. No plano gratuito (1 envio a cada 15 s) um dia
// tem no máximo 5.760 leituras, abaixo do limite de 8.000.
const DAY_MS = 24 * 60 * 60_000;
// Um dia só é considerado encerrado 10 min depois da meia-noite UTC (leituras atrasadas)
const CLOSE_MARGIN_MS = 10 * 60_000;
// Consultas simultâneas ao ThingSpeak quando o cache está vazio (ex.: primeiro acesso a 90 dias)
const MAX_PARALLEL = 6;
// Abaixo disso não divide mais a janela (evita uma cascata de consultas)
const MIN_SPLIT_MS = 60 * 60_000;

// "AAAA-MM-DD HH:NN:SS" em UTC, formato aceito por start/end do ThingSpeak
const tsDate = (ms: number) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");

// Busca uma janela; se vier cheia (8.000, só possível em planos pagos com envio mais
// frequente), divide ao meio para não perder o começo dela.
async function fetchWindow(start: number, end: number, depth = 0): Promise<Feed[] | null> {
  const feeds = await fetchFeeds({
    start: tsDate(start),
    end: tsDate(end),
    timezone: "UTC",
    results: String(MAX_RESULTS),
  });
  if (!feeds) return null;
  if (feeds.length < MAX_RESULTS || end - start <= MIN_SPLIT_MS || depth >= 3) return feeds;

  const mid = Math.floor((start + end) / 2);
  const [a, b] = await Promise.all([fetchWindow(start, mid, depth + 1), fetchWindow(mid + 1000, end, depth + 1)]);
  return a && b ? [...a, ...b] : null;
}

// Leituras de um dia UTC inteiro (00:00:00 a 23:59:59), com cache: longo se o dia já
// terminou, curto se ainda está em andamento.
function fetchDay(dayStart: number, now: number): Promise<Feed[] | null> {
  const closed = dayStart + DAY_MS + CLOSE_MARGIN_MS <= now;
  const day = new Date(dayStart).toISOString().slice(0, 10);
  return cached(["dia", day, closed ? "fechado" : "aberto"], closed ? TTL_DIA_FECHADO : TTL_DIA_ABERTO, () =>
    fetchWindow(dayStart, dayStart + DAY_MS - 1000)
  );
}

// Roda as tarefas com no máximo `limit` ao mesmo tempo (não sobrecarrega o ThingSpeak)
async function runLimited<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

// Todas as leituras do período, em ordem cronológica e sem repetição. Busca os dias (UTC)
// que o período toca, cada um com cache próprio, e recorta só o intervalo pedido.
export async function fetchRange(start: number, end: number, now = Date.now()): Promise<Feed[] | null> {
  const days: number[] = [];
  for (let d = Math.floor(start / DAY_MS) * DAY_MS; d <= end; d += DAY_MS) days.push(d);

  const parts = await runLimited(
    days.map((d) => () => fetchDay(d, now)),
    MAX_PARALLEL
  );
  if (parts.some((p) => p === null)) return null;

  const byId = new Map<number, Feed>();
  for (const feed of parts.flat() as Feed[]) {
    const t = new Date(feed.created_at).getTime();
    if (t >= start && t <= end) byId.set(feed.entry_id, feed);
  }
  return [...byId.values()].sort((a, b) => a.entry_id - b.entry_id);
}

// Sessão "ao vivo": a última leitura chegou há menos disso (mesmo limite do selo "Ao vivo")
const LIVE_MS = 5 * 60_000;

// Separa as leituras (em ordem cronológica) em sessões de medição: uma pausa maior que
// SESSION_GAP_MS começa uma sessão nova. Cada sessão ganha suas próprias médias, com o
// tamanho escolhido pela duração dela. Devolve da mais recente para a mais antiga.
export function buildSessions(feeds: Feed[], now = Date.now()): Session[] {
  const groups: Feed[][] = [];
  let last = -Infinity;
  for (const feed of feeds) {
    const t = new Date(feed.created_at).getTime();
    if (t - last > SESSION_GAP_MS || groups.length === 0) groups.push([]);
    groups[groups.length - 1].push(feed);
    last = t;
  }

  return groups
    .map((group) => {
      const start = new Date(group[0].created_at).getTime();
      const end = new Date(group[group.length - 1].created_at).getTime();
      const bucketMinutes = pickBucket(end - start);
      return {
        start,
        end,
        count: group.length,
        live: now - end < LIVE_MS,
        bucketMinutes,
        points: bucketFeeds(group, bucketMinutes),
      };
    })
    .reverse();
}

export async function getDashboardData(range: ChartRange) {
  const [latest, period] = await Promise.all([fetchLatest(20), fetchRange(range.start, range.end)]);
  const fetchedAt = Date.now();

  return {
    feeds: latest ? [...latest].reverse() : null, // Os mais recentes primeiro
    sessions: period ? buildSessions(period, fetchedAt) : [],
    chartFailed: period === null,
    fetchedAt,
  };
}
