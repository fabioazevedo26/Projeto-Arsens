// Valor enviado pelo ESP32 quando o botão físico de teste é acionado (999.90).
export const SIMULATION_THRESHOLD = 999;

export interface CoLevel {
  label: string;
  text: string; // classe de cor do texto
  dot: string; // classe de cor de fundo (indicadores)
  pulse: boolean;
}

export function isSimulation(ppm: number): boolean {
  return ppm >= SIMULATION_THRESHOLD;
}

// Faixas inspiradas nos padrões da EPA para CO (9 ppm/8 h e 35 ppm/1 h).
export function getCoLevel(ppm: number): CoLevel {
  if (ppm > 100) return { label: "Perigo", text: "text-red-500", dot: "bg-red-500", pulse: true };
  if (ppm > 35) return { label: "Risco", text: "text-orange-500", dot: "bg-orange-500", pulse: false };
  if (ppm >= 10) return { label: "Atenção", text: "text-yellow-400", dot: "bg-yellow-400", pulse: false };
  return { label: "Normal", text: "text-cyan-400", dot: "bg-cyan-400", pulse: false };
}

// Converte o campo do ThingSpeak em número; null/vazio/0.00 são falhas do sensor.
export function parseReading(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? n : null;
}
