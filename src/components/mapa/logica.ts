// Mapa: lê as MESMAS tarefas da agenda. Todo conteúdo (tipo "postagem") com data vira um nó. Só a data conta, sem horário.
import type { Tarefa } from "@/lib/dados";
import { deTexto, paraDia, somarDias } from "@/components/calendario/logica";

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
  tarefas.filter((t) => t.tipo === "postagem" && t.inicio).sort((a, b) => a.inicio!.localeCompare(b.inicio!));

/** Quantos conteúdos já foram postados no mês do início, mesmo antes do período (a linha só mostra o que vem pela frente). */
export const postadosNoMes = (lista: readonly Tarefa[], inicio: string) =>
  lista.filter((t) => foiPostado(t) && diaDe(t).startsWith(inicio.slice(0, 7))).length;

// ---------- formato "em ordem": o que fazer agora → próximo → depois ----------
export const ETAPAS_ATE_POSTAR = ["ideia", "roteiro", "gravacao", "edicao", "aprovado"] as const;
/** Próximo passo pela etapa em que o conteúdo está. Sem etapa conta como ideia. */
export const PASSO = { ideia: "Roteirizar", roteiro: "Gravar", gravacao: "Editar", edicao: "Aprovar", aprovado: "Postar" } as const;

export type Item = { t: Tarefa; dias: number; passo: string; etapa: number };
export type Faixa = "agora" | "proximo" | "depois";

export const diasAte = (dia: string, de: string) => Math.round((deTexto(dia).getTime() - deTexto(de).getTime()) / 864e5);

export function prazo(dias: number) {
  if (dias < 0) return dias === -1 ? "Atrasado 1 dia" : `Atrasado ${-dias} dias`;
  return dias === 0 ? "Hoje" : dias === 1 ? "Amanhã" : `Em ${dias} dias`;
}

/** Agora = atrasado, hoje e os 2 dias seguintes; Próximo = até 7 dias; Depois = o resto. */
export const faixaDe = (dias: number): Faixa => (dias <= 2 ? "agora" : dias <= 7 ? "proximo" : "depois");

/** Só o que falta postar, por urgência: data mais perto primeiro; no mesmo dia, quem está mais atrás na produção vem antes. */
export function emOrdem(lista: readonly Tarefa[], de: string): Item[] {
  return lista.filter((t) => !foiPostado(t)).map((t) => {
    const etapa = Math.max(0, ETAPAS_ATE_POSTAR.indexOf((t.etapa ?? "ideia") as (typeof ETAPAS_ATE_POSTAR)[number]));
    return { t, dias: diasAte(diaDe(t), de), passo: PASSO[ETAPAS_ATE_POSTAR[etapa]], etapa };
  }).sort((a, b) => a.dias - b.dias || a.etapa - b.etapa);
}
