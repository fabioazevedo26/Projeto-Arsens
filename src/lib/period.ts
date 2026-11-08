// Período do gráfico do painel técnico (?periodo=24h|7d|30d|intervalo&inicio=AAAA-MM-DD&fim=AAAA-MM-DD).
// Sem dependências de servidor: usado pela página (servidor) e pelo filtro (navegador).

export type PeriodKey = "24h" | "7d" | "30d" | "intervalo";

export interface ChartRange {
  key: PeriodKey;
  start: number; // epoch ms
  end: number; // epoch ms
  label: string; // ex.: "Últimos 7 dias"
  inicio?: string; // AAAA-MM-DD (só no intervalo específico)
  fim?: string;
  notice?: string; // aviso quando o intervalo pedido foi corrigido
}

export const PRESETS: { key: Exclude<PeriodKey, "intervalo">; label: string; short: string; hours: number }[] = [
  { key: "24h", label: "Últimas 24 h", short: "24 h", hours: 24 },
  { key: "7d", label: "Últimos 7 dias", short: "Semana", hours: 24 * 7 },
  { key: "30d", label: "Últimos 30 dias", short: "Mês", hours: 24 * 30 },
];

// Limite do intervalo específico: mantém a busca no ThingSpeak e o gráfico leves.
export const MAX_RANGE_DAYS = 90;

// Manaus é UTC-4 o ano todo (sem horário de verão): 00:00 em Manaus = 04:00 UTC.
const MANAUS_OFFSET_MS = 4 * 60 * 60_000;
const DAY_MS = 24 * 60 * 60_000;

// Tamanhos de média possíveis (min): escolhe o menor que deixa o gráfico de uma sessão com até
// ~360 pontos. O ESP32 envia ~1 leitura a cada 2,5 min, então 5 min é o menor útil.
const BUCKETS = [5, 10, 30, 60, 120, 240, 360, 720, 1440];
const MAX_POINTS = 360;

export function pickBucket(spanMs: number): number {
  const spanMin = spanMs / 60_000;
  return BUCKETS.find((b) => spanMin / b <= MAX_POINTS) ?? BUCKETS[BUCKETS.length - 1];
}

// "Hoje" no calendário de Manaus, como AAAA-MM-DD
export function todayInManaus(now = Date.now()): string {
  return new Date(now).toLocaleDateString("sv-SE", { timeZone: "America/Manaus" });
}

// AAAA-MM-DD (dia em Manaus) -> epoch ms da 00:00 desse dia em Manaus; null se inválida
function parseDay(value: string | undefined): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d) + MANAUS_OFFSET_MS;
  // Rejeita datas que "transbordam" (ex.: 2026-02-31)
  return new Date(ms - MANAUS_OFFSET_MS).getUTCDate() === d ? ms : null;
}

const formatDay = (value: string) => value.split("-").reverse().join("/");

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseRange(params: Record<string, string | string[] | undefined>, now = Date.now()): ChartRange {
  const periodo = first(params.periodo);
  const preset = PRESETS.find((p) => p.key === periodo) ?? PRESETS[0];

  if (periodo === "intervalo") {
    let inicio = first(params.inicio);
    let fim = first(params.fim);
    let startMs = parseDay(inicio);
    let endDayMs = parseDay(fim);

    if (startMs !== null && endDayMs !== null && inicio && fim) {
      const notices: string[] = [];
      if (startMs > endDayMs) {
        [startMs, endDayMs] = [endDayMs, startMs];
        [inicio, fim] = [fim, inicio];
      }
      if (startMs > now) {
        return { ...presetRange(preset, now), notice: "A data inicial está no futuro. Mostrando as últimas 24 h." };
      }
      if (endDayMs - startMs >= MAX_RANGE_DAYS * DAY_MS) {
        startMs = endDayMs - (MAX_RANGE_DAYS - 1) * DAY_MS;
        inicio = new Date(startMs - MANAUS_OFFSET_MS).toISOString().slice(0, 10);
        notices.push(`O intervalo máximo é de ${MAX_RANGE_DAYS} dias: mostrando a partir de ${formatDay(inicio)}.`);
      }
      const end = Math.min(endDayMs + DAY_MS, now); // inclui o dia final inteiro (até agora)
      return {
        key: "intervalo",
        start: startMs,
        end,
        label: inicio === fim ? formatDay(inicio) : `${formatDay(inicio)} a ${formatDay(fim)}`,
        inicio,
        fim,
        notice: notices.length ? notices.join(" ") : undefined,
      };
    }
    return { ...presetRange(preset, now), notice: "Intervalo inválido. Mostrando as últimas 24 h." };
  }

  return presetRange(preset, now);
}

function presetRange(preset: (typeof PRESETS)[number], now: number): ChartRange {
  const start = now - preset.hours * 60 * 60_000;
  return { key: preset.key, start, end: now, label: preset.label };
}

// Query string que reproduz o período (para links, como o download do histórico).
// "" = padrão (últimas 24 h).
export function rangeQuery(range: ChartRange): string {
  if (range.key === "24h") return "";
  if (range.key === "intervalo" && range.inicio && range.fim) {
    return new URLSearchParams({ periodo: "intervalo", inicio: range.inicio, fim: range.fim }).toString();
  }
  return `periodo=${range.key}`;
}

export function formatBucket(minutes: number): string {
  if (minutes < 60) return `${minutes} minutos`;
  if (minutes === 60) return "1 hora";
  if (minutes < 1440) return `${minutes / 60} horas`;
  return "1 dia";
}
