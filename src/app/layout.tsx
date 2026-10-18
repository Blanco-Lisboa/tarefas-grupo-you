import type { Metadata } from "next";
import { Bricolage_Grotesque, Host_Grotesk } from "next/font/google";
import { Casca } from "@/components/casca/Casca";
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
    <html lang="pt-BR" className={`${bricolage.variable} ${host.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Casca>{children}</Casca>
      </body>
    </html>
  );
}
