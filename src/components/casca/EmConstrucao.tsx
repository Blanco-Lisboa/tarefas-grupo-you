"use client";
import { useTarefas } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";

// Provisório: cada tela troca isto pela tela de verdade. A contagem prova que dados + filtro chegam na tela.
export function EmConstrucao({ titulo, comContagem = true }: { titulo: string; comContagem?: boolean }) {
  return (
    <section className="em-construcao">
      <h1>{titulo}</h1>
      <p className="aviso">Em construção. Esta tela ainda não foi feita.</p>
      {comContagem && <Contagem />}
    </section>
  );
}

function Contagem() {
  const tarefas = useTarefas();
  const { aplicar } = useFiltroEmpresa();
  const visiveis = aplicar(tarefas).length;
  return (
    <p style={{ marginTop: 16, color: "var(--cor-tinta-2)" }}>
      Tarefas visíveis com o filtro atual: <strong>{visiveis}</strong> de {tarefas.length}.
    </p>
  );
}
