import { parseReading } from "@/lib/co";
import { getRowStatus } from "@/lib/feed";
import { fetchFeeds } from "@/lib/thingspeak";

// Protegida pelo middleware (matcher /dashboard/:path*).
export async function GET() {
  const feeds = await fetchFeeds({ results: "8000" });

  if (!feeds) {
    return new Response("Falha ao buscar dados do ThingSpeak.", { status: 502 });
  }

  // "sv-SE" gera "AAAA-MM-DD HH:MM:SS", sem vírgulas — seguro para CSV.
  const manausTime = (iso: string) => new Date(iso).toLocaleString("sv-SE", { timeZone: "America/Manaus" });
  const num = (value: string | null) => parseReading(value)?.toString() ?? "";

  const lines = [
    "data_hora_utc,data_hora_manaus,co_ppm,temperatura_c,umidade_pct,status",
    ...feeds.map((f) =>
      [f.created_at, manausTime(f.created_at), num(f.field1), num(f.field2), num(f.field3), getRowStatus(f)].join(",")
    ),
  ];

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Manaus" });

  // BOM UTF-8 para o Excel reconhecer acentos.
  return new Response("﻿" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="arsens-historico-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
