import { isSimulation, parseReading } from "./co";
import type { ChartPoint, Feed } from "./feed";

interface ThingSpeakResponse {
  channel: {
    id: number;
    name: string;
    description: string;
  };
  feeds: Feed[];
}

// Busca leituras do canal em ordem cronológica (mais antiga primeiro).
export async function fetchFeeds(params: Record<string, string>): Promise<Feed[] | null> {
  const channelId = process.env.THINGSPEAK_CHANNEL_ID;
  const apiKey = process.env.THINGSPEAK_READ_API_KEY;

  if (!channelId) return null;

  const query = new URLSearchParams(params);
  if (apiKey) query.set("api_key", apiKey);

  try {
    const res = await fetch(
      `https://api.thingspeak.com/channels/${channelId}/feeds.json?${query}`,
      { cache: "no-store" } // Garante que pegue os dados mais recentes sempre
    );

    if (!res.ok) {
      throw new Error("Falha ao buscar dados do ThingSpeak");
    }

    const data: ThingSpeakResponse = await res.json();
    return data.feeds ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Agrupa as leituras em janelas de `minutes` minutos (média), ignorando falhas
// do sensor e valores de simulação, para manter o gráfico leve e legível.
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

export async function getDashboardData() {
  const [latest, lastDay] = await Promise.all([
    fetchFeeds({ results: "20" }),
    fetchFeeds({ days: "1", results: "8000" }),
  ]);

  return {
    feeds: latest ? [...latest].reverse() : null, // Os mais recentes primeiro
    chart: lastDay ? bucketFeeds(lastDay) : [],
    fetchedAt: Date.now(),
  };
}
