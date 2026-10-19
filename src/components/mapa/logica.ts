// Mapa: lê as MESMAS tarefas da agenda. Todo conteúdo (tipo "postagem") com data vira um nó. Só a data conta, sem horário.
import type { Tarefa } from "@/lib/dados";
import { deTexto, inicioSemana, paraDia, somarDias } from "@/components/calendario/logica";

// ponytail: começa em 19/10/2026 (o "amanhã" do pedido). Na Fase 2 vira o dia seguinte ao de hoje.
export const INICIO = "2026-10-19";

/** Do início até o último dia do mês do início. */
export function diasDoPeriodo(inicio = INICIO) {
  const d = deTexto(inicio);
  const fim = paraDia(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  const dias: string[] = [];
  for (let x = inicio; x <= fim; x = somarDias(x, 1)) dias.push(x);
  return dias;
}

// Sem objetivo preenchido, o cartão mostra o título.
export const objetivoDe = (t: Tarefa) => t.objetivo?.trim() || t.titulo;

export const foiPostado = (t: Tarefa) => t.etapa === "postado" || !!t.concluida;
const diaDe = (t: Tarefa) => t.inicio!.slice(0, 10);

export const conteudos = (tarefas: readonly Tarefa[]) =>
  tarefas.filter((t) => t.tipo === "postagem" && t.inicio).sort((a, b) => a.inicio!.localeCompare(b.inicio!));

/** Conteúdos por dia, só dos dias pedidos. */
export function porDia(lista: readonly Tarefa[], dias: readonly string[]) {
  const mapa = new Map<string, Tarefa[]>();
  for (const t of lista) {
    if (!dias.includes(diaDe(t))) continue;
    mapa.set(diaDe(t), [...(mapa.get(diaDe(t)) ?? []), t]);
  }
  return mapa;
}

/** Semanas (domingo a sábado) cortadas no período: a primeira pode ser curta. */
export function semanas(dias: readonly string[]) {
  const grupos: { inicio: string; dias: string[] }[] = [];
  for (const d of dias) {
    const i = inicioSemana(d);
    const g = grupos.at(-1);
    if (g?.inicio === i) g.dias.push(d);
    else grupos.push({ inicio: i, dias: [d] });
  }
  return grupos;
}

/** Quantos conteúdos já foram postados no mês do início, mesmo antes do período (a linha só mostra o que vem pela frente). */
export const postadosNoMes = (lista: readonly Tarefa[], inicio = INICIO) =>
  lista.filter((t) => foiPostado(t) && diaDe(t).startsWith(inicio.slice(0, 7))).length;
