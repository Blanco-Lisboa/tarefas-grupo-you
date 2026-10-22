import type { Tag, Tarefa } from "./tipos";

/** 272 · Tira de um card as tags de aprovação ("Esperando aprovação"), e só elas. As outras ficam. Sem tag sobrando, devolve undefined (como o resto do código). */
export const semTagDeAprovacao = (ids: readonly string[] | undefined, todas: readonly Tag[]): string[] | undefined => {
  const ficam = ids?.filter((id) => !todas.find((g) => g.id === id)?.aprovacao);
  return ficam?.length ? ficam : undefined;
};

/** Card que sai gravado como Aprovado (ou Postado): 272 a tag "Esperando aprovação" sai; 271 o pedido de Conserto fecha (o banco faz igual, 027).
    Outras etapas não mudam nada. Texto "" (e não undefined) quando a coluna existe, para a ficha saber que o campo vale. */
export const fecharAprovada = (t: Pick<Tarefa, "etapa" | "tags" | "consertoTexto">, todas: readonly Tag[]): Pick<Tarefa, "tags" | "consertoTexto"> =>
  t.etapa === "aprovado" || t.etapa === "postado"
    ? { tags: semTagDeAprovacao(t.tags, todas), consertoTexto: t.consertoTexto === undefined ? undefined : "" }
    : { tags: t.tags, consertoTexto: t.consertoTexto };

/** 271 · O que vai em `conserto_texto` ao salvar: só quando a coluna existe (027). Texto novo manda; texto tirado manda null; nunca teve, nem manda. */
export const campoConsertoTexto = (atual: string | undefined, antes: string | undefined): { conserto_texto?: string | null } =>
  atual?.trim() ? { conserto_texto: atual.trim() } : antes ? { conserto_texto: null } : {};

/** 287 · Card de conteúdo da Esteira = tem empresa e etapa. Esses não se apagam direto no banco (029); só pela função apagar_card ou pela função drive. */
export const ehConteudoCard = (t: Pick<Tarefa, "empresaId" | "etapa">) => !!t.empresaId && !!t.etapa;
