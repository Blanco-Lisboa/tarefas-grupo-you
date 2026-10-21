// Árvore da tela Pastas (item 229): Empresa → Formato → Tema → conteúdos (+ documentos soltos), lida do banco, sem estado próprio.
// Um conteúdo aparece quando o card tem Empresa e arquivo no Drive; some quando a limpeza dos 7 dias apaga as linhas de `arquivos`.
// A tela só desenha o que esta função devolve. Nome da pasta e contagem dos 7 dias vêm de `supabase/functions/_shared/pastas` (a função `drive` usa o mesmo arquivo).
import { DIAS_PARA_LIMPAR, FORMATOS, nomeFormato, nomePastaConteudo, SEM_TEMA } from "../../../supabase/functions/_shared/pastas";
import type { DocumentoSolto, Ocasiao } from "./drive";
import type { Arquivo, Formato, Tarefa } from "./tipos";

export type PastaConteudo = {
  tarefa: Tarefa;
  /** Nome da pasta no Drive: "<Formato> <tema> - <título>". */
  nome: string;
  /** Só os arquivos que estão no Drive (anexo antigo do Supabase fica só na ficha). */
  arquivos: Arquivo[];
  /** Quando o Drive manda esta pasta para a lixeira (aproximado: o banco conta do momento em que o card virou Postado). Ausente = não vence (não está Postado, ou tema permanente). */
  venceEm?: Date;
};
export type PastaTema = {
  /** Ausente = "Sem tema" (nunca tem cadeado). */
  ocasiao?: Ocasiao;
  nome: string;
  permanente: boolean;
  /** Tema sem nenhum conteúdo nem documento em lugar nenhum: aparece em todos os formatos, para dar onde subir o 1º documento. */
  vazio: boolean;
  conteudos: PastaConteudo[];
  documentos: DocumentoSolto[];
};
export type PastaFormato = {
  /** Ausente = "Sem formato" (só aparece quando tem conteúdo). */
  formato?: Formato;
  nome: string;
  temas: PastaTema[];
};

const MS_DIA = 86_400_000;
/** "2026-10-21T14:00" (Brasília, sem fuso) ou "2026-10-21" → instante. */
const brasilia = (txt: string) => new Date(txt.length > 10 ? `${txt}:00-03:00` : `${txt}T00:00:00-03:00`);

/** Quando o conteúdo vence: 7 dias depois de Postado. Base = a última rede postada (ou a data do post); se o Permanente foi desligado depois, conta de lá. */
export function venceEm(t: Tarefa, tema?: Pick<Ocasiao, "permanente" | "desligadoEm">): Date | undefined {
  if (t.etapa !== "postado" || tema?.permanente) return undefined;
  const postadas = (t.postagens ?? []).flatMap((p) => (p.postadoEm ? [new Date(p.postadoEm).getTime()] : []));
  const dataDoPost = t.postarEm ?? t.inicio;
  const base = postadas.length ? Math.max(...postadas) : dataDoPost ? brasilia(dataDoPost).getTime() : undefined;
  if (base === undefined || Number.isNaN(base)) return undefined;
  const desligado = tema?.desligadoEm ? new Date(tema.desligadoEm).getTime() : 0;
  return new Date(Math.max(base, desligado) + DIAS_PARA_LIMPAR * MS_DIA);
}

export const arquivosDoDrive = (t: Tarefa) => t.arquivos.filter((a) => a.driveId && !a.removido);

const porNome = (a: { nome: string }, b: { nome: string }) => a.nome.localeCompare(b.nome, "pt-BR");

export function arvoreDePastas(e: { empresaId: string; tarefas: Tarefa[]; ocasioes: Ocasiao[]; documentos: DocumentoSolto[] }): PastaFormato[] {
  const temas = e.ocasioes.filter((o) => o.empresaId === e.empresaId);
  const tema = (id?: string) => temas.find((o) => o.id === id);
  const conteudos: PastaConteudo[] = e.tarefas
    .filter((t) => t.empresaId === e.empresaId && arquivosDoDrive(t).length)
    .map((t) => ({ tarefa: t, nome: nomePastaConteudo(t.formato, tema(t.ocasiaoId)?.nome, t.titulo), arquivos: arquivosDoDrive(t), venceEm: venceEm(t, tema(t.ocasiaoId)) }))
    .sort((a, b) => (a.tarefa.postarEm ?? a.tarefa.inicio ?? "").localeCompare(b.tarefa.postarEm ?? b.tarefa.inicio ?? "") || a.tarefa.titulo.localeCompare(b.tarefa.titulo, "pt-BR"));
  const docs = e.documentos.filter((d) => d.empresaId === e.empresaId);
  const usado = new Set([...conteudos.map((c) => c.tarefa.ocasiaoId), ...docs.map((d) => d.ocasiaoId)].filter(Boolean));

  const doFormato = (formato?: Formato): PastaFormato => {
    const meus = conteudos.filter((c) => c.tarefa.formato === formato), meusDocs = docs.filter((d) => d.formato === formato);
    const pastas = (id?: string): PastaTema => {
      const o = tema(id);
      return { ocasiao: o, nome: o?.nome ?? SEM_TEMA, permanente: !!o?.permanente, vazio: false, conteudos: meus.filter((c) => (o ? c.tarefa.ocasiaoId === id : !tema(c.tarefa.ocasiaoId))), documentos: meusDocs.filter((d) => (o ? d.ocasiaoId === id : !tema(d.ocasiaoId))) };
    };
    const comItens = [...new Set([...meus.map((c) => c.tarefa.ocasiaoId), ...meusDocs.map((d) => d.ocasiaoId)])];
    const comTema = comItens.filter((id): id is string => !!id && !!tema(id)).map(pastas).sort(porNome);
    const vazios = formato ? temas.filter((o) => !usado.has(o.id)).map((o): PastaTema => ({ ...pastas(o.id), vazio: true })).sort(porNome) : [];
    const semTema = comItens.some((id) => !id || !tema(id)) ? [pastas(undefined)] : []; // tema apagado do banco cai em "Sem tema"
    return { formato, nome: nomeFormato(formato), temas: [...comTema, ...vazios, ...semTema] };
  };
  const reais = FORMATOS.map((f) => doFormato(f));
  const sem = doFormato(undefined);
  return sem.temas.length ? [...reais, sem] : reais;
}
