import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O site é 100% aberto (sem login). Links antigos para /login levam ao painel técnico.
  async redirects() {
    return [{ source: "/login", destination: "/dashboard", permanent: false }];
  },
};

export default nextConfig;
