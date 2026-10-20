import { Suspense } from "react";
import { connection } from "next/server";
import { TelaContorno } from "@/components/modelos/TelaContorno";

export const metadata = { title: "Contorno dos botões · Tarefas" };

async function Tela() {
  await connection(); // o campo de data lê a data de hoje: a página é montada a cada abertura, não no build
  return <TelaContorno />;
}

export default function Page() {
  return <Suspense><Tela /></Suspense>;
}
