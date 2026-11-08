import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content Security Policy: diz ao navegador de onde a página pode carregar cada coisa.
// Se alguém conseguir injetar conteúdo no site, o navegador bloqueia scripts, imagens e
// molduras de outros endereços.
// - 'unsafe-inline' em script-src: o script do tema (layout.tsx) e os scripts que o Next
//   coloca na página são inline. A alternativa (nonce) exigiria um Proxy e renderização por
//   requisição em todas as rotas. Ver node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md
// - 'unsafe-eval' só em desenvolvimento (o React usa eval para mostrar erros; não em produção)
// - frame-src: o mini-mapa do OpenStreetMap (LocationMap.tsx)
// - frame-ancestors 'none': nenhum outro site pode exibir o ARSENS dentro de uma moldura
// - upgrade-insecure-requests só na Vercel (HTTPS); no `npm start` local (HTTP) quebraria a página
// A fonte (next/font) e as imagens (next/image) são servidas pelo próprio site ('self').
// O ThingSpeak é consultado pelo servidor, não pelo navegador, então não aparece aqui.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://www.openstreetmap.org",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Não deixa o navegador "adivinhar" o tipo de um arquivo (ex.: tratar texto como script)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Para navegadores antigos que não entendem frame-ancestors
  { key: "X-Frame-Options", value: "DENY" },
  // Links para outros sites (EPA, OMS, OpenStreetMap, Telegram) recebem só o domínio, não a URL completa
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // O site não usa câmera, microfone nem localização: desliga esses recursos
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  // O site é 100% aberto (sem login). Links antigos para /login levam ao painel técnico.
  async redirects() {
    return [{ source: "/login", destination: "/dashboard", permanent: false }];
  },

  async headers() {
    return [
      // Cabeçalhos de segurança em todas as rotas
      { source: "/:path*", headers: securityHeaders },
      // O service worker nunca pode ficar preso em cache: cada visita confere a versão mais nova.
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
