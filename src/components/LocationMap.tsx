// Ponto de coleta: parada de ônibus "Atlantic Tower C/B" (OSM node 4107509102).
const LAT = -3.10042;
const LON = -60.02397;
const DELTA = 0.003;

const EMBED_URL =
  "https://www.openstreetmap.org/export/embed.html?" +
  new URLSearchParams({
    bbox: `${LON - DELTA},${LAT - DELTA},${LON + DELTA},${LAT + DELTA}`,
    layer: "mapnik",
    marker: `${LAT},${LON}`,
  });

const FULL_MAP_URL = `https://www.openstreetmap.org/?mlat=${LAT}&mlon=${LON}#map=17/${LAT}/${LON}`;

export default function LocationMap() {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-lg">
      <div className="border-b border-slate-700 px-5 py-4">
        <h2 className="text-base font-semibold text-white">Ponto de coleta</h2>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
          <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
          </svg>
          Parada Atlantic Tower · Av. Djalma Batista, Manaus/AM
        </p>
      </div>

      {/* Filtro CSS escurece o mapa do OpenStreetMap para combinar com o tema */}
      <div className="relative min-h-64 flex-1">
        <iframe
          title="Mapa do ponto de coleta na Av. Djalma Batista"
          src={EMBED_URL}
          loading="lazy"
          tabIndex={-1}
          // Estático: evita que a roda do mouse dê zoom no mapa em vez de rolar a página
          className="pointer-events-none absolute inset-0 h-full w-full border-0 [filter:invert(90%)_hue-rotate(180deg)_brightness(0.95)_contrast(0.9)]"
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-700 px-5 py-3 text-xs">
        <span className="text-slate-400">Via de alto tráfego</span>
        <a
          href={FULL_MAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 font-medium text-cyan-400 hover:text-cyan-300"
        >
          Abrir mapa ↗
        </a>
      </div>
    </section>
  );
}
