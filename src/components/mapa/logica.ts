// Mapa: lê as MESMAS tarefas da agenda. Todo conteúdo (tipo "postagem") com data vira um nó. Só a data conta, sem horário.
import type { Tarefa } from "@/lib/dados";
import { deTexto, paraDia, somarDias } from "@/components/calendario/logica";
import { diasDeAtraso } from "@/lib/atraso";
import { ehConteudo, montarGrade } from "@/components/tarefas/grade";

/** Hoje pelo relógio do navegador, em data local (nunca toISOString: em UTC viraria o dia errado à noite no Brasil). */
export const hoje = (agora = new Date()) => paraDia(agora);

/** Do início até o fim do mês do início, ou até `ate` (a última postagem com data), o que vier depois. */
export function diasDoPeriodo(inicio: string, ate = "") {
  const d = deTexto(inicio);
  const fimDoMes = paraDia(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  const fim = ate > fimDoMes ? ate : fimDoMes;
  const dias: string[] = [];
  for (let x = inicio; x <= fim; x = somarDias(x, 1)) dias.push(x);
  return dias;
}

// O cartão mostra só o título, para bater o olho e saber do que se trata. Sem título, o objetivo serve de reserva.
export const tituloDe = (t: Tarefa) => t.titulo.trim() || t.objetivo?.trim() || "Sem título";

export const foiPostado = (t: Tarefa) => t.etapa === "postado" || !!t.concluida;
const diaDe = (t: Tarefa) => t.inicio!.slice(0, 10);

export const ultimoDia = (lista: readonly Tarefa[]) => lista.reduce((m, t) => (diaDe(t) > m ? diaDe(t) : m), "");

export const conteudos = (tarefas: readonly Tarefa[]) =>
  tarefas.filter((t) => ehConteudo(t) && t.tipo === "postagem" && t.inicio).sort((a, b) => a.inicio!.localeCompare(b.inicio!));

/** Quantos conteúdos já foram postados no mês do início, mesmo antes do período (a linha só mostra o que vem pela frente). */
export const postadosNoMes = (lista: readonly Tarefa[], inicio: string) =>
  lista.filter((t) => foiPostado(t) && diaDe(t).startsWith(inicio.slice(0, 7))).length;

// ---------- formato "Fila": um card por dia, o que fazer em cada um ----------
export const ETAPAS_ATE_POSTAR = ["roteiro", "gravacao", "edicao", "analise", "aprovado"] as const;
/** Próximo passo pela etapa em que o conteúdo está. Sem etapa conta como roteiro. */
export const PASSO = { roteiro: "Gravar", gravacao: "Editar", edicao: "Enviar para análise", analise: "Aprovar", aprovado: "Postar" } as const;

export type Item = { t: Tarefa; dias: number; passo: string };
/** `dias` = quantos dias faltam para o dia do card (0 = hoje). */
export type DiaFila = { dia: string; dias: number; itens: Item[] };

export const diasAte = (dia: string, de: string) => Math.round((deTexto(dia).getTime() - deTexto(de).getTime()) / 864e5);

export function prazo(dias: number) {
  if (dias < 0) return dias === -1 ? "Atrasado 1 dia" : `Atrasado ${-dias} dias`;
  return dias === 0 ? "Hoje" : dias === 1 ? "Amanhã" : `Em ${dias} dias`;
}

/**
 * O que falta fazer, um grupo por dia, do mais perto ao mais longe. O grupo de hoje existe sempre (mesmo vazio) e leva
 * no topo o que ficou atrasado. Dentro do dia a ordem é a da folha do Caderno: com horário na linha do horário, sem horário
 * na ordem em que foi criado (a lista chega na ordem de criação, e a ordenação por data é estável).
 */
export function filaPorDia(lista: readonly Tarefa[], de: string): DiaFila[] {
  const itens = new Map<string, Item>();
  const porDia = new Map<string, Tarefa[]>();
  for (const t of lista) {
    if (!ehConteudo(t)) continue;
    // entra o que vem pela frente (postagem a postar) e todo atrasado, mesmo de antes do período do Mapa (mesma regra do Conteúdos)
    if (!t.inicio || (!diasDeAtraso(t, de) && (t.tipo !== "postagem" || foiPostado(t)))) continue;
    const etapa = Math.max(0, ETAPAS_ATE_POSTAR.indexOf((t.etapa ?? "roteiro") as (typeof ETAPAS_ATE_POSTAR)[number]));
    itens.set(t.id, { t, dias: diasAte(diaDe(t), de), passo: PASSO[ETAPAS_ATE_POSTAR[etapa]] });
    const dia = diaDe(t) < de ? de : diaDe(t); // atrasado cai em hoje
    porDia.set(dia, [...(porDia.get(dia) ?? []), t]);
  }
  if (!porDia.size) return [];
  // atrasados primeiro: ordenados pelo dia de origem (o mais antigo no topo), cada dia na ordem da folha
  const doDia = (ts: Tarefa[]) => montarGrade([...ts].sort((a, b) => a.inicio!.localeCompare(b.inicio!)), true).filter((t): t is Tarefa => !!t);
  const atrasadas = (porDia.get(de) ?? []).filter((t) => diaDe(t) < de);
  const dehoje = (porDia.get(de) ?? []).filter((t) => diaDe(t) >= de);
  const pilhaAtraso = [...new Set(atrasadas.map(diaDe))].sort().flatMap((d) => doDia(atrasadas.filter((t) => diaDe(t) === d)));
  porDia.set(de, [...pilhaAtraso, ...doDia(dehoje)]);
  return [...porDia].sort(([a], [b]) => a.localeCompare(b)).map(([dia, ts]) => ({ dia, dias: diasAte(dia, de), itens: (dia === de ? ts : doDia(ts)).map((t) => itens.get(t.id)!) }));
}
