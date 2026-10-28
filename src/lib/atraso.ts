import { horaDeBrasilia, type Tarefa } from "@/lib/dados";

const diaNumero = (texto: string) => { const [a, m, d] = texto.split("-").map(Number); return Date.UTC(a, m - 1, d) / 86_400_000; };

/** Quando o conteúdo acontece: card de Postagem usa a data e hora de POSTAR quando existe (programado pode nem ter início); senão, o início;
    sem nenhum dos dois, a hora (de Brasília) em que foi para Postado. É a regra do banco (private.quando_do_post).
    Uma regra só para o Mapa (que a reexporta) e para o atraso; mora aqui porque o Mapa já importa este arquivo. */
export const quandoDe = (t: Tarefa) => (t.tipo === "postagem" && t.postarEm) || t.inicio || (t.postadoEm ? horaDeBrasilia(t.postadoEm) : undefined);

/** Regra única de "atrasado" (Conteúdos e Fila do Mapa): conteúdo com data já passada e etapa diferente de Postado. Devolve os dias de atraso, 0 = não está atrasado. */
export function diasDeAtraso(t: Tarefa, hoje: string): number {
  const quando = quandoDe(t);
  if (!t.etapa || t.etapa === "postado" || !quando || !hoje) return 0;
  return Math.max(0, diaNumero(hoje) - diaNumero(quando.slice(0, 10)));
}
