import type { Metadata } from "next";
import { TelaNovaSenha } from "@/components/entrar/TelaNovaSenha";

export const metadata: Metadata = { title: "Escolha sua senha · Tarefas" };

export default function Page() {
  return <TelaNovaSenha />;
}
