import { ehReuniao } from "@/components/tarefas/grade";
import { comoNatham, type Etapa, type NovaTarefa, type Responsavel } from "@/lib/dados";

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

/** Espelha private.pode_aprovar (015, 026): o Natham ou o Adrian, ou a pessoa cujo nome é o aprovador (nome = slug com maiúscula). Sem aprovador: só eles. */
export const ehQuemAprova = (aprovador: string | undefined, eu: Responsavel | null) =>
  comoNatham(eu) || (!!eu && eu === aprovador?.trim().toLowerCase());

/** Espelha private.pode_trocar_aprovador (021, item 223): quem escolhe "Quem aprova" num card que já existe é o Natham, o Matheus
    ou quem aprova hoje. Antes era só ehQuemAprova, e o Matheus não escolhia nada em card do Natham ou sem aprovador. */
export const podeTrocarAprovador = (aprovador: string | undefined, eu: Responsavel | null) => eu === "matheus" || ehQuemAprova(aprovador, eu);

/** 243: só as tags que ainda existem vão para o banco (uma tag excluída por outra pessoa faria o salvar inteiro falhar). */
export const soTagsQueExistem = (ids: readonly string[] | undefined, existem: readonly string[]) => {
  const ficam = ids?.filter((id) => existem.includes(id));
  return ficam?.length ? ficam : undefined;
};

/** 243 · Texto da confirmação de excluir tag. `total` = todos os cards (função do banco, 022); null = a função falhou: conta só os que a pessoa vê e diz isso. */
export function textoExcluirTag(total: number | null, visiveis: number) {
  const cards = (n: number) => `${n} ${n === 1 ? "card" : "cards"}`;
  if (total !== null) return total ? `Ela sai de ${cards(total)}.` : "Nenhum card usa esta tag.";
  return visiveis
    ? `Ela sai de ${cards(visiveis)} que você vê (e de outros que só o dono vê).`
    : "Nenhum card que você vê usa esta tag (ela sai também dos que só o dono vê).";
}

/** 239: o Tema é da Empresa. Trocar a Empresa tira o Tema (o salvar manda null: campoOcasiao), senão o card da Beec guardaria um Tema da You. */
export const trocarEmpresa = (t: NovaTarefa, empresaId: string): NovaTarefa => (empresaId === t.empresaId ? t : { ...t, empresaId, ocasiaoId: undefined });

/** 229: título, formato, tema ou empresa mudou → a pasta do conteúdo no Drive muda de lugar e de nome (organizarCard, se já tem arquivo lá). */
export const mudouPasta = (antes: NovaTarefa, depois: NovaTarefa) => (["titulo", "formato", "ocasiaoId", "empresaId"] as const).some((k) => (antes[k] ?? "") !== (depois[k] ?? ""));

// Fim só vale se vier depois do início; senão a tarefa fica sem fim (vira um ponto no horário).
export function fimValido(dia: string, ini: string, diaFim: string, fim: string) {
  if (!fim) return undefined;
  const a = `${dia}T${ini}`, b = `${diaFim}T${fim}`;
  return b > a ? b : undefined;
}
