import { parseReading } from "@/lib/co";
import { getRowStatus, type RowStatus } from "@/lib/feed";
import { fetchFeeds } from "@/lib/thingspeak";

const STATUS_LABEL: Record<RowStatus, string> = { ok: "OK", erro: "Erro", simulacao: "Simulação" };

// Protegida pelo middleware (matcher /dashboard/:path*).
// ?formato=excel (padrão) -> CSV no padrão brasileiro: separador ";" e decimal ","
// ?formato=padrao         -> CSV internacional (",", decimal "."), ideal para Python/R
export async function GET(request: Request) {
  const formato = new URL(request.url).searchParams.get("formato") === "padrao" ? "padrao" : "excel";
  const feeds = await fetchFeeds({ results: "8000" });

  if (!feeds) {
    return new Response("Falha ao buscar dados do ThingSpeak.", { status: 502 });
  }

  // "sv-SE" gera "AAAA-MM-DD HH:MM:SS" no fuso de Manaus.
  const manausTime = (iso: string) => new Date(iso).toLocaleString("sv-SE", { timeZone: "America/Manaus" });

  let lines: string[];

  if (formato === "padrao") {
    const num = (value: string | null) => parseReading(value)?.toString() ?? "";
    lines = [
      "data_hora_utc,data_hora_manaus,co_ppm,temperatura_c,umidade_pct,status",
      ...feeds.map((f) =>
        [f.created_at, manausTime(f.created_at), num(f.field1), num(f.field2), num(f.field3), getRowStatus(f)].join(",")
      ),
    ];
  } else {
    // Duas casas decimais com vírgula; vazio quando a leitura falhou.
    const num = (value: string | null) => parseReading(value)?.toFixed(2).replace(".", ",") ?? "";
    // Data no formato DD/MM/AAAA, que o Excel em português reconhece como data.
    const brDate = (iso: string) =>
      new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Manaus" });

    lines = [
      "Data;Hora;CO (ppm);Temperatura (°C);Umidade (%);Status",
      ...feeds.map((f) => {
        const status = getRowStatus(f);
        return [
          brDate(f.created_at),
          manausTime(f.created_at).slice(11),
          status === "simulacao" ? "" : num(f.field1), // 999,90 é botão de teste, não medição
          num(f.field2),
          num(f.field3),
          STATUS_LABEL[status],
        ].join(";");
      }),
    ];
  }

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Manaus" });
  const suffix = formato === "padrao" ? "-padrao" : "";

  // BOM UTF-8 para o Excel reconhecer acentos; CRLF é a quebra de linha esperada no Windows.
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="arsens-historico-${today}${suffix}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
