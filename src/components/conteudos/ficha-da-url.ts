import { useEffect } from "react";
import type { Tarefa } from "@/lib/dados";

// 268: o aviso de envio interrompido leva a /conteudos?ficha=<id>; abre a ficha desse card (uma vez) e limpa o endereço.
export function useFichaDaUrl(tarefas: Tarefa[], abrir: (t: Tarefa) => void) {
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("ficha");
    const t = id ? tarefas.find((x) => x.id === id) : undefined;
    if (!t) return;
    window.history.replaceState(null, "", window.location.pathname);
    abrir(t);
  }, [tarefas, abrir]);
}
