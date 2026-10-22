import { useEffect, useRef } from "react";
import type { Tarefa } from "@/lib/dados";

export const EVENTO_FICHA = "grade:ficha";

// 268: o aviso de envio interrompido leva a /conteudos?ficha=<id>. Abre a ficha desse card ao carregar a tela (vindo de outra) ou
// quando o aviso avisa (já estando nela, o endereço muda mas a tela não recarrega), e limpa o endereço.
export function useFichaDaUrl(tarefas: Tarefa[], abrir: (t: Tarefa) => void) {
  const vivas = useRef(tarefas);
  useEffect(() => { vivas.current = tarefas; }); // antes do efeito abaixo: a ordem dos efeitos é a da escrita
  useEffect(() => {
    const tenta = (id: string | null | undefined) => {
      const t = id ? vivas.current.find((x) => x.id === id) : undefined;
      if (!t) return false;
      window.history.replaceState(null, "", window.location.pathname);
      abrir(t);
      return true;
    };
    const daUrl = () => tenta(new URLSearchParams(window.location.search).get("ficha"));
    const aoAvisar = (e: Event) => void tenta((e as CustomEvent<string>).detail);
    daUrl();
    window.addEventListener(EVENTO_FICHA, aoAvisar);
    return () => window.removeEventListener(EVENTO_FICHA, aoAvisar);
  }, [tarefas.length, abrir]);
}
