// Tipos e regras compartilhados entre Server e Client Components.
import { isSimulation, parseReading } from "./co";

export interface Feed {
  created_at: string;
  entry_id: number;
  field1: string | null; // CO (PPM)
  field2: string | null; // Temperatura (°C)
  field3: string | null; // Umidade (%)
}

export interface ChartPoint {
  ts: number; // epoch ms (centro do intervalo)
  co: number | null;
  temp: number | null;
  hum: number | null;
}

export type RowStatus = "ok" | "erro" | "simulacao";

export function getRowStatus(feed: Feed): RowStatus {
  const co = parseReading(feed.field1);
  if (co !== null && isSimulation(co)) return "simulacao";
  if (co === null || parseReading(feed.field2) === null || parseReading(feed.field3) === null) {
    return "erro";
  }
  return "ok";
}
