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

// O ThingSpeak devolve no máximo 8.000 leituras por consulta (as mais recentes da janela).
const MAX_RESULTS = 8000;
// Janela de cada consulta: ~1 leitura a cada 2,5 min dá ~5.800 leituras em 10 dias.
const CHUNK_MS = 10 * 24 * 60 * 60_000;
// Abaixo disso não divide mais a janela (evita uma cascata de consultas)
const MIN_SPLIT_MS = 60 * 60_000;

// "AAAA-MM-DD HH:NN:SS" em UTC, formato aceito por start/end do ThingSpeak
const tsDate = (ms: number) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");

// Busca uma janela; se vier cheia (8.000), divide ao meio para não perder o começo dela.
async function fetchWindow(start: number, end: number, depth = 0): Promise<Feed[] | null> {
  const feeds = await fetchFeeds({
    start: tsDate(start),
    end: tsDate(end),
    timezone: "UTC",
    results: String(MAX_RESULTS),
  });
  if (!feeds) return null;
  if (feeds.length < MAX_RESULTS || end - start <= MIN_SPLIT_MS || depth >= 4) return feeds;

  const mid = Math.floor((start + end) / 2);
  const [a, b] = await Promise.all([fetchWindow(start, mid, depth + 1), fetchWindow(mid, end, depth + 1)]);
  return a && b ? [...a, ...b] : null;
}

// Todas as leituras do período, em ordem cronológica e sem repetição nas emendas das janelas.
export async function fetchRange(start: number, end: number): Promise<Feed[] | null> {
  const windows: [number, number][] = [];
  for (let s = start; s < end; s += CHUNK_MS) windows.push([s, Math.min(s + CHUNK_MS, end)]);

  const parts = await Promise.all(windows.map(([s, e]) => fetchWindow(s, e)));
  if (parts.some((p) => p === null)) return null;

  const byId = new Map<number, Feed>();
  for (const feed of parts.flat() as Feed[]) byId.set(feed.entry_id, feed);
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
  const [latest, period] = await Promise.all([fetchFeeds({ results: "20" }), fetchRange(range.start, range.end)]);
  const fetchedAt = Date.now();

  return {
    feeds: latest ? [...latest].reverse() : null, // Os mais recentes primeiro
    sessions: period ? buildSessions(period, fetchedAt) : [],
    chartFailed: period === null,
    fetchedAt,
  };
}
