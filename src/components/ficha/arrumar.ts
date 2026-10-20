import type { NovaTarefa, Responsavel } from "@/lib/dados";

/** O que a Ficha manda salvar (Lupa R6-1): a tarefa da ficha, depois `extras` (data, anexos, links...), e por último os campos
    arrumados: sem a tag de aprovação o aprovador sai, título e notas sem espaços nas pontas, objetivo só em postagem.
    Por último de propósito: vindo antes, o `...t` gravaria o valor antigo/bruto. */
export const arrumar = (t: NovaTarefa, pedeAprovador: boolean, extras: Partial<NovaTarefa> = {}): NovaTarefa => ({
  ...t,
  ...extras,
  aprovador: pedeAprovador ? t.aprovador : undefined,
  titulo: t.titulo.trim(),
  objetivo: t.tipo === "postagem" ? t.objetivo?.trim() || undefined : undefined,
  notas: t.notas?.trim() || undefined,
});

/** Espelha private.pode_aprovar (015): o Natham, ou a pessoa cujo nome é o aprovador (nome = slug com maiúscula). Sem aprovador: só o Natham. */
export const ehQuemAprova = (aprovador: string | undefined, eu: Responsavel | null) =>
  eu === "natham" || (!!eu && eu === aprovador?.trim().toLowerCase());

// Fim só vale se vier depois do início; senão a tarefa fica sem fim (vira um ponto no horário).
export function fimValido(dia: string, ini: string, diaFim: string, fim: string) {
  if (!fim) return undefined;
  const a = `${dia}T${ini}`, b = `${diaFim}T${fim}`;
  return b > a ? b : undefined;
}
