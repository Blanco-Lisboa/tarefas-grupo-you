// Datas do calendário: SEMPRE pelo relógio local, em texto "AAAA-MM-DD" e "AAAA-MM-DDTHH:MM".
// Nunca toISOString: ele converte para o fuso de Londres e, depois das 21h, já marca o dia seguinte.
import type { NovaTarefa, Tarefa } from "@/lib/dados";

export type Visao = "dia" | "semana" | "mes" | "ano";
/** Para onde a tarefa foi solta. null = coluna "Sem data". */
export type Destino = { dia: string; minuto?: number; diaInteiro?: boolean } | null;

const p2 = (n: number) => String(n).padStart(2, "0");
export const paraDia = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const paraHora = (d: Date) => `${paraDia(d)}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
export function deTexto(s: string) {
  const [a, m, d] = s.slice(0, 10).split("-").map(Number);
  const [h, min] = s.length > 10 ? s.slice(11, 16).split(":").map(Number) : [0, 0];
  return new Date(a, m - 1, d, h, min);
}
export const somarDias = (dia: string, n: number) => { const d = deTexto(dia); d.setDate(d.getDate() + n); return paraDia(d); };
const somarMinutos = (hora: string, n: number) => { const d = deTexto(hora); d.setMinutes(d.getMinutes() + n); return paraHora(d); };
export const minutoDoDia = (hora: string) => (hora.length > 10 ? Number(hora.slice(11, 13)) * 60 + Number(hora.slice(14, 16)) : 0);
export const comMinuto = (dia: string, min: number) => `${dia}T${p2(Math.floor(min / 60))}:${p2(min % 60)}`;
const diasEntre = (a: string, b: string) => Math.round((deTexto(b).getTime() - deTexto(a).getTime()) / 86_400_000);

/** Semana começa no domingo, como no Google Agenda do Brasil. */
export const inicioSemana = (dia: string) => somarDias(dia, -deTexto(dia).getDay());
export const diasDaSemana = (dia: string) => Array.from({ length: 7 }, (_, i) => somarDias(inicioSemana(dia), i));
/** Grade do mês: semanas inteiras (domingo a sábado) que cobrem o mês, 5 ou 6 linhas. */
export function diasDoMes(dia: string) {
  const primeiro = `${dia.slice(0, 7)}-01`;
  const d = deTexto(primeiro);
  const total = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const semanas = Math.ceil((d.getDay() + total) / 7);
  return Array.from({ length: semanas * 7 }, (_, i) => somarDias(inicioSemana(primeiro), i));
}

/** Um passo para trás (-1) ou para frente (+1) na visão atual. */
export function andar(visao: Visao, dia: string, passo: 1 | -1) {
  if (visao === "dia") return somarDias(dia, passo);
  if (visao === "semana") return somarDias(dia, 7 * passo);
  const d = deTexto(dia);
  d.setDate(1); // 31/01 + 1 mês não pode cair em março
  if (visao === "mes") d.setMonth(d.getMonth() + passo);
  else d.setFullYear(d.getFullYear() + passo);
  return paraDia(d);
}

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("pt-BR", o);
const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const nomeMes = (dia: string) => maiuscula(fmt({ month: "long" }).format(deTexto(dia)));
export const nomeSemana = (dia: string, tamanho: "short" | "long" = "short") =>
  maiuscula(fmt({ weekday: tamanho }).format(deTexto(dia)).replace(".", ""));
export const diaCurto = (dia: string) => `${Number(dia.slice(8, 10))}/${dia.slice(5, 7)}`;
export const horaCurta = (hora: string) => hora.slice(11, 16);

/** Título do período e o ano (o ano sai em cinza ao lado). */
export function tituloPeriodo(visao: Visao, dia: string): [string, string] {
  const ano = dia.slice(0, 4);
  if (visao === "ano") return ["", ano];
  if (visao === "mes") return [nomeMes(dia), ano];
  if (visao === "dia") return [`${nomeSemana(dia, "long")}, ${Number(dia.slice(8, 10))} de ${nomeMes(dia).toLowerCase()}`, ano];
  const [a, b] = [inicioSemana(dia), somarDias(inicioSemana(dia), 6)];
  return [a.slice(5, 7) === b.slice(5, 7) ? `${Number(a.slice(8))} a ${Number(b.slice(8))} de ${nomeMes(a).toLowerCase()}` : `${diaCurto(a)} a ${diaCurto(b)}`, b.slice(0, 4)];
}

/** Tarefa com hora que termina em outro dia: aparece na faixa de "dia inteiro" de cada dia que cobre. */
export const variosDias = (t: Tarefa) => !!t.inicio && !!t.fim && !t.diaInteiro && t.fim.slice(0, 10) > t.inicio.slice(0, 10);
export function diasCobertos(t: Tarefa) {
  if (!t.inicio) return [];
  const dias = [t.inicio.slice(0, 10)];
  if (variosDias(t)) while (dias[dias.length - 1] < t.fim!.slice(0, 10)) dias.push(somarDias(dias[dias.length - 1], 1));
  return dias;
}

/** Agrupa as tarefas por dia (uma tarefa de vários dias entra em cada um), em ordem: dia inteiro primeiro, depois por hora. */
export function porDia(tarefas: Tarefa[]) {
  const mapa = new Map<string, Tarefa[]>();
  for (const t of tarefas) for (const d of diasCobertos(t)) mapa.set(d, [...(mapa.get(d) ?? []), t]);
  const chave = (t: Tarefa) => (t.diaInteiro || variosDias(t) ? "" : t.inicio!);
  for (const lista of mapa.values()) lista.sort((a, b) => chave(a).localeCompare(chave(b)) || a.titulo.localeCompare(b.titulo));
  return mapa;
}

/** Nova versão da tarefa depois de arrastada. Mantém a duração quando dá. */
export function mover(t: Tarefa, destino: Destino): NovaTarefa {
  if (!destino) return { ...t, inicio: undefined, fim: undefined, diaInteiro: false };
  const { dia, minuto, diaInteiro } = destino;
  if (diaInteiro) return { ...t, inicio: dia, fim: undefined, diaInteiro: true };
  const temHora = !!t.inicio && !t.diaInteiro;
  const duracao = temHora && t.fim ? Math.round((deTexto(t.fim).getTime() - deTexto(t.inicio!).getTime()) / 60_000) : null;
  if (minuto !== undefined) {
    const inicio = comMinuto(dia, minuto);
    const fim = duracao !== null ? somarMinutos(inicio, duracao) : temHora ? undefined : somarMinutos(inicio, 60);
    return { ...t, inicio, fim, diaInteiro: false };
  }
  // Solta num dia do mês/ano: troca só a data e mantém o horário.
  if (!temHora) return { ...t, inicio: dia, fim: undefined, diaInteiro: true };
  const desloca = diasEntre(t.inicio!.slice(0, 10), dia);
  return { ...t, inicio: somarDias(t.inicio!.slice(0, 10), desloca) + t.inicio!.slice(10), fim: t.fim && somarDias(t.fim.slice(0, 10), desloca) + t.fim.slice(10) };
}

/** Lado a lado quando os horários se cruzam: cada tarefa ganha uma faixa e o total de faixas do seu grupo. */
export function faixas<T extends { ini: number; fim: number }>(itens: T[]) {
  const ordem = [...itens].sort((a, b) => a.ini - b.ini || b.fim - a.fim);
  const saida: (T & { faixa: number; total: number })[] = [];
  let grupo: (T & { faixa: number; total: number })[] = [], fins: number[] = [], fimGrupo = -1;
  const fechar = () => grupo.forEach((g) => (g.total = fins.length));
  for (const it of ordem) {
    if (it.ini >= fimGrupo) { fechar(); grupo = []; fins = []; }
    let f = fins.findIndex((x) => x <= it.ini);
    if (f < 0) f = fins.push(0) - 1;
    fins[f] = it.fim;
    const item = { ...it, faixa: f, total: 1 };
    grupo.push(item); saida.push(item);
    fimGrupo = Math.max(fimGrupo, it.fim);
  }
  fechar();
  return saida;
}
