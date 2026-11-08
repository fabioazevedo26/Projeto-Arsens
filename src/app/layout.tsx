import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import NetworkStatus from "@/components/pwa/NetworkStatus";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import { THEME_COLOR, THEME_STORAGE_KEY } from "@/lib/theme-key";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARSENS · Monitoramento Ambiental",
  description: "Monitoramento em tempo real de CO, temperatura e umidade na Av. Djalma Batista, Manaus.",
  applicationName: "ARSENS",
  // Instalação no iPhone/iPad (Compartilhar > Adicionar à Tela de Início)
  appleWebApp: { capable: true, title: "ARSENS", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // usa a tela toda; cabeçalho e rodapé respeitam as safe areas
  // Valor inicial; o script abaixo e o botão sol/lua trocam pela cor do tema real
  themeColor: THEME_COLOR.light,
};

// Aplica o tema antes da página ser desenhada (evita o "flash" branco no modo escuro).
// Fica num <script> comum no <head>, que roda durante a leitura do HTML, antes da pintura:
// usa a escolha salva no navegador ou, na primeira visita, a preferência do sistema.
// Também ajusta o theme-color (barra do navegador/sistema) para a cor do tema.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);var c=d?"${THEME_COLOR.dark}":"${THEME_COLOR.light}";var a=function(){document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content",c)})};a();document.addEventListener("DOMContentLoaded",a);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: a classe "dark" é aplicada pelo script antes da hidratação
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Primeiro item do Tab: leva direto ao conteúdo, sem passar pelo cabeçalho.
            Invisível até receber o foco do teclado; leitores de tela sempre o encontram. */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-xl focus:bg-slate-900 focus:px-4 focus:py-3 focus:text-base focus:font-semibold focus:text-white dark:focus:bg-slate-100 dark:focus:text-slate-900"
        >
          Pular para o conteúdo
        </a>
        {children}
        <NetworkStatus />
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
