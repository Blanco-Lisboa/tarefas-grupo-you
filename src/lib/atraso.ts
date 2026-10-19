import type { Tarefa } from "@/lib/dados";

const diaNumero = (texto: string) => { const [a, m, d] = texto.split("-").map(Number); return Date.UTC(a, m - 1, d) / 86_400_000; };

/** Regra única de "atrasado" (Conteúdos e Fila do Mapa): conteúdo com data já passada e etapa diferente de Postado. Devolve os dias de atraso, 0 = não está atrasado. */
export function diasDeAtraso(t: Tarefa, hoje: string): number {
  if (!t.etapa || t.etapa === "postado" || !t.inicio || !hoje) return 0;
  return Math.max(0, diaNumero(hoje) - diaNumero(t.inicio.slice(0, 10)));
}
