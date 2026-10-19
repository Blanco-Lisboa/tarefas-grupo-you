import type { Metadata } from "next";
import { Bricolage_Grotesque, Host_Grotesk } from "next/font/google";
import { Casca } from "@/components/casca/Casca";
import { SCRIPT_MENU } from "@/components/casca/menu-recolhido";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["800"],
});

const host = Host_Grotesk({
  variable: "--font-host",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grade de conteúdo",
  description: "Calendário, tarefas e conteúdos de todas as empresas do Grupo You.",
  icons: { icon: "/beec/logo/favicon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: o SCRIPT_MENU muda o data-menu do <html> antes do React chegar (menu recolhido lembrado).
    <html lang="pt-BR" className={`${bricolage.variable} ${host.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_MENU }} />
      </head>
      <body className="min-h-full">
        <Casca>{children}</Casca>
      </body>
    </html>
  );
}
