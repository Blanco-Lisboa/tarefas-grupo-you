import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { Casca } from "@/components/casca/Casca";
import { SCRIPT_MENU } from "@/components/casca/menu-recolhido";
import "./globals.css";

// Letra do modelo 1 Névoa (item 60): Inter, a mais próxima da SF Pro que dá para usar na web.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tarefas",
  icons: { icon: "/marca/fivecon.png" },
  description: "Calendário, tarefas e conteúdos de todas as empresas do Grupo You.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: o SCRIPT_MENU muda o data-menu do <html> antes do React chegar (menu recolhido lembrado),
    // e extensões de tradução do Chrome acrescentam classes (translator-hidden...) no <html> e no <body>. translate="no":
    // a tela já está em português, então o Chrome não oferece traduzir nem mexe no texto.
    <html lang="pt-BR" translate="no" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full" suppressHydrationWarning>
        <Script id="menu-recolhido" strategy="beforeInteractive">{SCRIPT_MENU}</Script>
        <Casca>{children}</Casca>
      </body>
    </html>
  );
}
