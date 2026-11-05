import type { MetadataRoute } from "next";

// Manifesto do PWA (servido em /manifest.webmanifest). Permite instalar o ARSENS na tela inicial.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ARSENS",
    short_name: "ARSENS",
    description: "Qualidade do ar em tempo real na Av. Djalma Batista, em Manaus: monóxido de carbono, temperatura e umidade.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#0D9488",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
