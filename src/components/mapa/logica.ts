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

// Sem objetivo preenchido, o cartão mostra o título.
export const objetivoDe = (t: Tarefa) => t.objetivo?.trim() || t.titulo;

export const foiPostado = (t: Tarefa) => t.etapa === "postado" || !!t.concluida;
const diaDe = (t: Tarefa) => t.inicio!.slice(0, 10);

export const ultimoDia = (lista: readonly Tarefa[]) => lista.reduce((m, t) => (diaDe(t) > m ? diaDe(t) : m), "");

export const conteudos = (tarefas: readonly Tarefa[]) =>
  tarefas.filter((t) => t.tipo === "postagem" && t.inicio).sort((a, b) => a.inicio!.localeCompare(b.inicio!));

/** Quantos conteúdos já foram postados no mês do início, mesmo antes do período (a linha só mostra o que vem pela frente). */
export const postadosNoMes = (lista: readonly Tarefa[], inicio: string) =>
  lista.filter((t) => foiPostado(t) && diaDe(t).startsWith(inicio.slice(0, 7))).length;
