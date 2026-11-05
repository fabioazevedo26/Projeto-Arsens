// Service worker do ARSENS (manual, sem bibliotecas).
//
// Regra de ouro: NUNCA guardar nem servir do cache qualquer coisa que possa conter uma leitura.
// Só ficam em cache a tela offline e os ícones. Todo o resto vai direto para a rede, sem
// intervenção: páginas HTML, payloads RSC do router.refresh(), rotas de API, /dashboard/export,
// arquivos de /_next/ e requisições de outras origens (ThingSpeak, OpenStreetMap...).
//
// Ao mudar a lista abaixo ou o conteúdo de offline.html, aumente a versão: o activate apaga
// os caches antigos.

const VERSION = "v2";
const CACHE_PREFIX = "arsens-shell-";
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // cache: "reload" evita copiar uma versão antiga do cache HTTP do navegador
      .then((cache) => cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Só GET; POST e afins seguem normalmente
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Outras origens (ThingSpeak, OpenStreetMap, fontes...): não interfere
  if (url.origin !== self.location.origin) return;

  // Downloads do histórico: sem intervenção (sem rede, o download falha normalmente,
  // em vez de "baixar" a tela offline como se fosse a planilha)
  if (url.pathname.startsWith("/dashboard/export")) return;

  // Navegação (abrir/recarregar uma página): sempre da rede. Sem rede, mostra a tela offline.
  // A resposta da rede NÃO é guardada: uma página antiga nunca aparece como atual.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Ícones e a própria tela offline: do cache, se houver (não contêm leituras)
  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
    return;
  }

  // Todo o resto (RSC, /_next/, /dashboard/export, manifesto...): sem intervenção do service worker
});
