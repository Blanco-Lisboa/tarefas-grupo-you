import type { Tarefa } from "@/lib/dados";

// Margem de horários do caderno (igual ao CRM): a linha k vale 07:00 + 30 min × k, 31 linhas até 22:00.
export const PRIMEIRA = 7 * 60;
export const PASSO = 30;
export const SLOTS = 31;

const dois = (n: number) => String(n).padStart(2, "0");
const hhmm = (m: number) => `${dois(Math.floor(m / 60))}:${dois(m % 60)}`;

export const rotuloSlot = (k: number) => (k < SLOTS ? hhmm(PRIMEIRA + k * PASSO) : "");
/** "HH:MM" do início, ou "" se for dia inteiro ou sem hora. */
export const horaDe = (t: Tarefa) => (t.diaInteiro || !t.inicio || t.inicio.length < 16 ? "" : t.inicio.slice(11, 16));
export const minutos = (hora: string) => +hora.slice(0, 2) * 60 + +hora.slice(3, 5);
export const horaDoSlot = (k: number) => hhmm(PRIMEIRA + k * PASSO);
export const somarMinutos = (hora: string, n: number) => hhmm(Math.min(23 * 60 + 59, minutos(hora) + n));

/**
 * Cada tarefa mora na linha do seu horário (antes das 07:00 vai para 07:00, depois das 22:00 para 22:00).
 * Linha ocupada: desce para a próxima livre. Sem hora: ocupa as primeiras linhas livres. Sempre sobra uma linha vazia.
 * Entrada já ordenada por hora.
 */
export function montarGrade(tarefas: Tarefa[], porHora: boolean): (Tarefa | null)[] {
  const linhas: (Tarefa | undefined)[] = [];
  const semHora: Tarefa[] = [];
  for (const t of tarefas) {
    const h = porHora ? horaDe(t) : "";
    if (!h) { semHora.push(t); continue; }
    let k = Math.min(SLOTS - 1, Math.max(0, Math.floor((minutos(h) - PRIMEIRA) / PASSO)));
    while (linhas[k]) k++;
    linhas[k] = t;
  }
  for (const t of semHora) {
    let k = 0;
    while (linhas[k]) k++;
    linhas[k] = t;
  }
  return Array.from({ length: Math.max(SLOTS, linhas.length + 1) }, (_, k) => linhas[k] ?? null);
}

/** Milissegundos até a próxima meia-noite local (mais 500 de folga para o relógio já ter virado). */
export const msAteMeiaNoite = (agora: Date): number =>
  new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1).getTime() - agora.getTime() + 500;

/** Conteúdo de empresa tem etapa e empresa. Postagem sem empresa continua sendo tarefa pessoal do Caderno. */
export const ehConteudo = (t: Pick<Tarefa, "etapa" | "empresaId">): boolean => !!(t.etapa && t.empresaId);

/** O caderno de `de` = o que é DELE (dono; o banco não transfere dono ao trocar o responsável). Conteúdo com empresa segue o responsável. Sem `de`, tudo. */
export const doCaderno = (t: Tarefa, de: string | null | undefined) =>
  !de || (ehConteudo(t) ? t.responsavel === de : (t.dono ?? t.responsavel) === de);

/** Nas listas pessoais, conteúdo com empresa aparece para todos; o restante segue o dono do Caderno. */
export const daMinhaLista = (t: Tarefa, eu: string | null | undefined) =>
  ehConteudo(t) || (!!eu && doCaderno(t, eu));
