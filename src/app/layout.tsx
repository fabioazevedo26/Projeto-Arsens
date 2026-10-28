import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { THEME_STORAGE_KEY } from "@/lib/theme-key";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARSENS · Monitoramento Ambiental",
  description: "Monitoramento em tempo real de CO, temperatura e umidade na Av. Djalma Batista, Manaus.",
};

// Aplica o tema antes da página ser desenhada (evita o "flash" branco no modo escuro).
// Fica num <script> comum no <head>, que roda durante a leitura do HTML, antes da pintura:
// usa a escolha salva no navegador ou, na primeira visita, a preferência do sistema.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
