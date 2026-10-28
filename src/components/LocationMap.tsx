import Icon from "./Icon";

// Ponto de coleta: parada de ônibus "Atlantic Tower C/B" (OSM node 4107509102).
export const LAT = -3.10042;
export const LON = -60.02397;
const DELTA = 0.003;

const EMBED_URL =
  "https://www.openstreetmap.org/export/embed.html?" +
  new URLSearchParams({
    bbox: `${LON - DELTA},${LAT - DELTA},${LON + DELTA},${LAT + DELTA}`,
    layer: "mapnik",
    marker: `${LAT},${LON}`,
  });

export const FULL_MAP_URL = `https://www.openstreetmap.org/?mlat=${LAT}&mlon=${LON}#map=18/${LAT}/${LON}`;

// Mini-mapa do OpenStreetMap com legenda sobreposta. É estático (pointer-events-none) para a
// rolagem da página não virar zoom; o link "Ver no mapa" abre a versão interativa.
export default function LocationMap({ className = "h-56" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${className}`}>
      <iframe
        title="Mapa do ponto de coleta na Av. Djalma Batista"
        src={EMBED_URL}
        loading="lazy"
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 h-full w-full border-0"
      />
      <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl bg-white/95 px-3 py-2 shadow-raised">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900">
          <Icon name="mapPin" className="h-4 w-4 shrink-0 text-brand" />
          <span className="truncate">Parada Millennium / Uninorte</span>
        </span>
        <a
          href={FULL_MAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-brand-strong hover:underline"
        >
          Ver no mapa
          <Icon name="externalLink" className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
