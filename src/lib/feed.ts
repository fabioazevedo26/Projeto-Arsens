// Tipos e regras compartilhados entre Server e Client Components.
import { isSimulation, parseReading } from "./co";

export interface Feed {
  created_at: string;
  entry_id: number;
  field1: string | null; // CO (PPM)
  field2: string | null; // Temperatura (°C)
  field3: string | null; // Umidade (%)
  field4?: string | null; // Rs do MQ-7 (Ω) — ausente nas leituras antigas
  rs: number | null; // field4 já convertido (preenchido em fetchFeeds)
}

export interface ChartPoint {
  ts: number; // epoch ms (centro do intervalo)
  co: number | null;
  temp: number | null;
  hum: number | null;
}

// Sessão de medição: bloco de leituras seguidas, sem pausa maior que SESSION_GAP_MS.
export interface Session {
  start: number; // epoch ms da primeira leitura
  end: number; // epoch ms da última leitura
  count: number; // total de leituras recebidas (inclui as com erro)
  live: boolean; // a sessão ainda está acontecendo (última leitura há menos de 5 min)
  bucketMinutes: number; // tamanho de cada média no gráfico da sessão
  points: ChartPoint[]; // médias da sessão, ordem cronológica
}

// Pausa sem leituras que separa duas sessões (o ESP32 envia ~1 leitura a cada 2,5 min)
export const SESSION_GAP_MS = 30 * 60_000;

export type RowStatus = "ok" | "erro" | "simulacao";

// Rs é dado de diagnóstico: vazio/inválido vira null, mas NÃO marca a linha como erro.
export function parseRs(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

// Abaixo de 1.000 Ω mostra em Ω ("980 Ω"); a partir daí, em kΩ com 1 casa ("21,7 kΩ").
export function formatRs(ohms: number): { value: string; unit: string } {
  if (ohms < 1000) return { value: String(ohms), unit: "Ω" };
  const kohms = (ohms / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return { value: kohms, unit: "kΩ" };
}

export function formatRsText(ohms: number | null): string {
  if (ohms === null) return "—";
  const { value, unit } = formatRs(ohms);
  return `${value} ${unit}`;
}

// A regra de erro considera só CO, temperatura e umidade (field1–3); Rs fica de fora.
export function getRowStatus(feed: Feed): RowStatus {
  const co = parseReading(feed.field1);
  if (co !== null && isSimulation(co)) return "simulacao";
  if (co === null || parseReading(feed.field2) === null || parseReading(feed.field3) === null) {
    return "erro";
  }
  return "ok";
}
