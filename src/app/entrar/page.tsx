import type { Metadata } from "next";
import { TelaEntrar } from "@/components/entrar/TelaEntrar";

export const metadata: Metadata = { title: "Entrar · Tarefas" };

export default function Page() {
  return <TelaEntrar />;
}
