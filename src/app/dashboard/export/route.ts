import ExcelJS from "exceljs";
import { isSimulation, parseReading } from "@/lib/co";
import { getRowStatus, type Feed, type RowStatus } from "@/lib/feed";
import { fetchFeeds } from "@/lib/thingspeak";

const STATUS_LABEL: Record<RowStatus, string> = { ok: "OK", erro: "Erro", simulacao: "Simulação" };

// Manaus é UTC-4 o ano todo (sem horário de verão).
const MANAUS_OFFSET_MS = -4 * 60 * 60_000;

// Protegida pelo middleware (matcher /dashboard/:path*).
// ?formato=excel (padrão) -> planilha .xlsx formatada para o Excel
// ?formato=padrao         -> CSV internacional (",", decimal "."), ideal para Python/R
export async function GET(request: Request) {
  const formato = new URL(request.url).searchParams.get("formato") === "padrao" ? "padrao" : "excel";
  const feeds = await fetchFeeds({ results: "8000" });

  if (!feeds) {
    return new Response("Falha ao buscar dados do ThingSpeak.", { status: 502 });
  }

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Manaus" });

  if (formato === "padrao") {
    return new Response("﻿" + buildCsv(feeds), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="arsens-historico-${today}-padrao.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const buffer = await buildWorkbook(feeds).xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="arsens-historico-${today}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

function buildCsv(feeds: Feed[]): string {
  // "sv-SE" gera "AAAA-MM-DD HH:MM:SS" no fuso de Manaus.
  const manausTime = (iso: string) => new Date(iso).toLocaleString("sv-SE", { timeZone: "America/Manaus" });
  const num = (value: string | null) => parseReading(value)?.toString() ?? "";

  return [
    "data_hora_utc,data_hora_manaus,co_ppm,temperatura_c,umidade_pct,status",
    ...feeds.map((f) =>
      [f.created_at, manausTime(f.created_at), num(f.field1), num(f.field2), num(f.field3), getRowStatus(f)].join(",")
    ),
  ].join("\r\n");
}

function buildWorkbook(feeds: Feed[]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ARSENS";

  const sheet = workbook.addWorksheet("Histórico", {
    views: [{ state: "frozen", ySplit: 1 }], // cabeçalho fixo ao rolar
  });

  sheet.columns = [
    { header: "Data", key: "data", width: 12, style: { numFmt: "dd/mm/yyyy" } },
    { header: "Hora", key: "hora", width: 10, style: { numFmt: "hh:mm:ss" } },
    { header: "CO (ppm)", key: "co", width: 11, style: { numFmt: "0.00" } },
    { header: "Temperatura (°C)", key: "temp", width: 17, style: { numFmt: "0.00" } },
    { header: "Umidade (%)", key: "hum", width: 13, style: { numFmt: "0.00" } },
    { header: "Status", key: "status", width: 12 },
  ];

  for (const feed of feeds) {
    const status = getRowStatus(feed);
    const co = parseReading(feed.field1);
    // O Excel não guarda fuso: gravamos o horário local de Manaus como se fosse UTC.
    const local = new Date(new Date(feed.created_at).getTime() + MANAUS_OFFSET_MS);

    const row = sheet.addRow({
      data: local,
      hora: local,
      co: co !== null && !isSimulation(co) ? co : null, // 999,90 é botão de teste, não medição
      temp: parseReading(feed.field2),
      hum: parseReading(feed.field3),
      status: STATUS_LABEL[status],
    });

    if (status !== "ok") {
      // Amarelo claro para erro, lilás para simulação
      const color = status === "erro" ? "FFFEF3C7" : "FFEDE9FE";
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
      });
    }
  }

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.alignment = { vertical: "middle", horizontal: "center" };
  header.height = 20;
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } }; // slate-800
  });

  sheet.autoFilter = { from: "A1", to: "F1" };

  // Aba com metadados, útil para quem usar os dados em pesquisa
  const info = workbook.addWorksheet("Sobre os dados");
  info.columns = [{ width: 22 }, { width: 80 }];
  info.addRows([
    ["Projeto", "ARSENS — monitoramento de CO, temperatura e umidade"],
    ["Local", "Parada Atlantic Tower C/B, Av. Djalma Batista, Manaus/AM (-3.10042, -60.02397)"],
    ["Sensores", "ESP32 + MQ-7 (CO) + BME280 (temperatura e umidade)"],
    ["Fuso horário", "America/Manaus (UTC-4)"],
    ["Exportado em", new Date(Date.now() + MANAUS_OFFSET_MS)],
    ["Status OK", "Leitura válida"],
    ["Status Erro", "Falha do sensor (valor 0,00 ou vazio em algum campo); célula deixada em branco"],
    ["Status Simulação", "Botão de teste do ESP32 (CO = 999,90); CO deixado em branco"],
    ["Observação", "Leituras do MQ-7 são indicativas, não certificadas."],
  ]);
  info.getColumn(1).font = { bold: true };
  info.getCell("B5").numFmt = "dd/mm/yyyy hh:mm";
  info.getCell("B5").alignment = { horizontal: "left" };

  return workbook;
}
