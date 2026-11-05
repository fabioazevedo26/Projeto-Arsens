import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O site é 100% aberto (sem login). Links antigos para /login levam ao painel técnico.
  async redirects() {
    return [{ source: "/login", destination: "/dashboard", permanent: false }];
  },

  // O service worker nunca pode ficar preso em cache: cada visita confere a versão mais nova.
  async headers() {
    return [
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
