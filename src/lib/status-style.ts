// Apresentação dos status do CO na identidade ARSENS (tripla codificação: cor + ícone + texto).
// Só aparência: as faixas continuam vindo de getCoLevel (co.ts), que não é alterado aqui.
import { getCoLevel, isSimulation } from "./co";
import type { IconName } from "@/components/Icon";

export type StatusKey = "boa" | "atencao" | "risco" | "perigo" | "calibracao" | "demo" | "semDados";

export interface StatusStyle {
  label: string; // nome para o cidadão
  icon: IconName;
  solid: string; // fundo sólido + texto legível sobre ele (ícones, chips fortes)
  soft: string; // fundo claro + borda (cards de destaque)
  text: string; // cor do texto sobre fundo branco (contraste AA)
  dot: string; // marcador pequeno / barra da escala
  range?: string;
  advice: string; // orientação prática
}

export const STATUS: Record<StatusKey, StatusStyle> = {
  boa: {
    label: "Qualidade Boa",
    icon: "leaf",
    solid: "bg-emerald-600 text-white",
    soft: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    range: "0 a 9 ppm",
    advice: "O ar está adequado para respirar. Pode esperar o ônibus com tranquilidade.",
  },
  atencao: {
    label: "Atenção",
    icon: "alertCircle",
    solid: "bg-amber-500 text-slate-900", // nunca texto branco sobre âmbar
    soft: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
    range: "10 a 35 ppm",
    advice:
      "Acima do recomendado para exposição prolongada. Pessoas sensíveis devem evitar ficar muito tempo junto à via.",
  },
  risco: {
    label: "Risco Moderado",
    icon: "alertTriangle",
    solid: "bg-orange-600 text-white",
    soft: "bg-orange-50 border-orange-200",
    text: "text-orange-700",
    dot: "bg-orange-600",
    range: "36 a 100 ppm",
    advice:
      "Níveis elevados. Evite permanecer perto da pista. Crianças, idosos, gestantes e cardíacos devem se afastar.",
  },
  perigo: {
    label: "Perigo",
    icon: "octagonStop",
    solid: "bg-red-600 text-white",
    soft: "bg-red-50 border-red-200",
    text: "text-red-700",
    dot: "bg-red-600",
    range: "acima de 100 ppm",
    advice: "Níveis muito altos. Se puder, afaste-se da via. Com dor de cabeça, tontura ou enjoo, procure um local arejado.",
  },
  calibracao: {
    label: "Sensor em calibração",
    icon: "gear",
    solid: "bg-sky-600 text-white",
    soft: "bg-sky-50 border-sky-200",
    text: "text-sky-700",
    dot: "bg-sky-600",
    advice:
      "Estamos ajustando o sensor de monóxido de carbono para garantir leituras confiáveis. Enquanto isso, o indicador fica pausado. Temperatura e umidade seguem sendo medidas normalmente.",
  },
  demo: {
    label: "Modo de Demonstração",
    icon: "play",
    solid: "bg-violet-600 text-white",
    soft: "bg-violet-50 border-violet-200",
    text: "text-violet-700",
    dot: "bg-violet-600",
    advice: "O sensor está em um teste de demonstração neste momento. A próxima leitura real aparecerá em instantes.",
  },
  semDados: {
    label: "Sem leitura no momento",
    icon: "cloudOff",
    solid: "bg-slate-500 text-white",
    soft: "bg-slate-100 border-slate-200",
    text: "text-slate-600",
    dot: "bg-slate-400",
    advice: "Não recebemos uma medição válida do sensor agora. Tente novamente em alguns minutos.",
  },
};

// As quatro faixas da escala, na ordem, para a régua "Como ler o indicador".
export const SCALE_KEYS = ["boa", "atencao", "risco", "perigo"] as const;

const LEVEL_TO_KEY: Record<string, StatusKey> = {
  Normal: "boa",
  Atenção: "atencao",
  Risco: "risco",
  Perigo: "perigo",
};

// Converte uma leitura de CO (já validada por parseReading) na chave visual do status.
export function coStatusKey(ppm: number | null): StatusKey {
  if (ppm === null) return "semDados";
  if (isSimulation(ppm)) return "demo";
  return LEVEL_TO_KEY[getCoLevel(ppm).label] ?? "semDados";
}
