import { ehReuniao } from "@/components/tarefas/grade";
import type { Etapa, NovaTarefa, Responsavel } from "@/lib/dados";

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

/** Item 205 (a ficha não tem mais o campo Etapa): card NOVO com empresa entra sozinho em Roteiro na Esteira. Quem já existe fica
    como está (sem etapa = tarefa do Caderno, que nunca vira card); reunião nunca é conteúdo. O Caderno cria pela folha, não pela ficha. */
export const etapaAoSalvar = (t: NovaTarefa): Etapa | undefined => t.etapa ?? (!t.id && t.empresaId && !ehReuniao(t) ? "roteiro" : undefined);

/** Espelha private.pode_aprovar (015): o Natham, ou a pessoa cujo nome é o aprovador (nome = slug com maiúscula). Sem aprovador: só o Natham. */
export const ehQuemAprova = (aprovador: string | undefined, eu: Responsavel | null) =>
  eu === "natham" || (!!eu && eu === aprovador?.trim().toLowerCase());

/** Espelha private.pode_trocar_aprovador (021, item 223): quem escolhe "Quem aprova" num card que já existe é o Natham, o Matheus
    ou quem aprova hoje. Antes era só ehQuemAprova, e o Matheus não escolhia nada em card do Natham ou sem aprovador. */
export const podeTrocarAprovador = (aprovador: string | undefined, eu: Responsavel | null) => eu === "matheus" || ehQuemAprova(aprovador, eu);

// Fim só vale se vier depois do início; senão a tarefa fica sem fim (vira um ponto no horário).
export function fimValido(dia: string, ini: string, diaFim: string, fim: string) {
  if (!fim) return undefined;
  const a = `${dia}T${ini}`, b = `${diaFim}T${fim}`;
  return b > a ? b : undefined;
}
