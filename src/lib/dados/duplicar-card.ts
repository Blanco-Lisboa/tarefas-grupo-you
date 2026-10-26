import { semTagDeAprovacao } from "./esteira";
import type { Etapa, NovaTarefa, Tag, Tarefa } from "./tipos";

const SUFIXO = / - Cópia \d+$/;
const nunca: Etapa[] = ["aprovado", "postado"]; // a cópia ainda não foi aprovada nem postada: volta para a primeira coluna

/** 310 · Título da cópia: "<base> - Cópia N". A base tira o sufixo de uma cópia anterior (duplicar "X - Cópia 1" conta a partir de "X");
    N = maior número já usado nessa base (na mesma empresa) + 1. */
export function tituloDaCopia(titulo: string, todas: readonly Pick<Tarefa, "titulo" | "empresaId">[], empresaId: string) {
  const base = titulo.replace(SUFIXO, "");
  const usados = todas.filter((t) => t.empresaId === empresaId).map((t) => (t.titulo.startsWith(`${base} - Cópia `) ? Number(t.titulo.slice(base.length + 9)) : 0)).filter(Number.isInteger);
  return `${base} - Cópia ${Math.max(0, ...usados) + 1}`;
}

/** 310 · Cópia "de planejamento" de um card da Esteira, sem id (nasce nova). Leva: empresa, tipo, formato, rede, responsável, tema, roteiro, objetivo, tags, cor.
    NÃO leva: anexos, links (pasta do Drive), aprovação (tag e quem aprova), conserto, datas e postagem, legenda, redes e capa do post. */
export function duplicarCard(o: Tarefa, todas: readonly Tarefa[], tags: readonly Tag[]): NovaTarefa {
  return {
    titulo: tituloDaCopia(o.titulo, todas, o.empresaId), tipo: o.tipo, empresaId: o.empresaId, rede: o.rede, formato: o.formato, responsavel: o.responsavel,
    etapa: o.etapa && !nunca.includes(o.etapa) ? o.etapa : "roteiro", diaInteiro: false, cor: o.cor, corLinha: o.corLinha,
    objetivo: o.objetivo, notas: o.notas, ocasiaoId: o.ocasiaoId, tags: semTagDeAprovacao(o.tags, tags), links: [], arquivos: [],
  };
}
