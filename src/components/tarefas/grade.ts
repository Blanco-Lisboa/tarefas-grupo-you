import type { EventoAgenda, Responsavel, Tarefa } from "@/lib/dados";
import { ultimoDia } from "@/components/calendario/logica";

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

/** Reunião (item 188) = tipo Reunião ou título com "reunião", "reuniões" ou a abreviação "reun", sem ligar para maiúscula
    ou acento. "Reunir material" não conta. Só o título já basta: é o que o evento do Google traz. */
export const ehReuniao = (t: { titulo: string; tipo?: string }): boolean =>
  t.tipo === "reuniao" || /\b(reuni(ao|oes)|reun)\b/.test(t.titulo.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase());

/** Conteúdo de empresa tem etapa e empresa. Postagem sem empresa continua sendo tarefa pessoal do Caderno.
    Reunião nunca é conteúdo (fica no Calendário e no Caderno, fora da Esteira, do Mapa e da Fila). */
export const ehConteudo = (t: Pick<Tarefa, "etapa" | "empresaId" | "titulo" | "tipo">): boolean => !!(t.etapa && t.empresaId) && !ehReuniao(t);

/** Tarefa pessoal que `de` mandou para outra pessoa: continua no caderno de quem enviou (item 144), onde ele edita e apaga. */
export const enviadaPorMim = (t: Tarefa, de: string | null | undefined) =>
  !!de && !ehConteudo(t) && t.enviadaPor === de && !!t.dono && t.dono !== de;

/** O caderno de `de` = o que é DELE (dono; o banco não transfere dono ao trocar o responsável) mais o que ele enviou. Conteúdo com empresa segue o responsável. Sem `de`, tudo. */
export const doCaderno = (t: Tarefa, de: string | null | undefined) =>
  !de || (ehConteudo(t) ? t.responsavel === de : (t.dono ?? t.responsavel) === de || enviadaPorMim(t, de));

/** Nas listas pessoais, conteúdo com empresa aparece para todos; o restante segue o dono do Caderno. */
export const daMinhaLista = (t: Tarefa, eu: string | null | undefined) =>
  ehConteudo(t) || (!!eu && doCaderno(t, eu));

/** Compromissos do Google que caem em `dia` (também os de vários dias), dia inteiro primeiro, depois por hora. */
export const eventosDoDia = (eventos: EventoAgenda[], dia: string, dono: Responsavel | null) =>
  eventos
    .filter((e) => !!dono && e.fontes.includes(dono) && e.inicio.slice(0, 10) <= dia && dia <= ultimoDia(e))
    .sort((a, b) => Number(b.diaInteiro) - Number(a.diaInteiro) || a.inicio.localeCompare(b.inicio));

/** "09:00 às 10:00", "a partir das 09:00" ou "dia inteiro". Compromisso que vem de outro dia mostra só o que vale hoje. */
export const quandoEvento = (e: EventoAgenda, dia: string) => {
  if (e.diaInteiro) return "dia inteiro";
  const ini = e.inicio.slice(0, 10) === dia ? e.inicio.slice(11, 16) : "";
  const fim = e.fim && e.fim.slice(0, 10) === dia ? e.fim.slice(11, 16) : "";
  return ini && fim ? `${ini} às ${fim}` : ini ? `a partir das ${ini}` : fim ? `até as ${fim}` : "dia inteiro";
};

// ===== Compromissos do Google dentro das linhas do Caderno (item 221) =====
const semAcento = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const palavras = (s: string) => new Set(semAcento(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2));

/** Um título contém o outro (4 letras ou mais) ou as palavras de um e de outro coincidem em 60% (interseção sobre união). */
export const titulosParecidos = (a: string, b: string): boolean => {
  const x = semAcento(a).trim(), y = semAcento(b).trim();
  if (!x || !y) return false;
  if (Math.min(x.length, y.length) >= 4 && (x.includes(y) || y.includes(x))) return true;
  const A = palavras(a), B = palavras(b);
  const junto = new Set([...A, ...B]).size;
  return junto > 0 && [...A].filter((w) => B.has(w)).length / junto >= 0.6;
};

/** Já existe tarefa digitada para este compromisso: mesmo dia, início até 30 min de diferença (dia inteiro: tarefa sem hora) e título parecido. */
export const jaTemTarefa = (e: EventoAgenda, tarefas: Tarefa[]): boolean =>
  tarefas.some((t) => {
    const h = horaDe(t);
    const perto = e.diaInteiro ? !h : !!h && e.inicio.slice(0, 10) === t.inicio?.slice(0, 10) && Math.abs(minutos(h) - minutos(e.inicio.slice(11, 16))) <= 30;
    return perto && titulosParecidos(e.titulo, t.titulo);
  });

const FIM_GRADE = PRIMEIRA + SLOTS * PASSO; // 22:30: a linha das 22:00 vai até aqui

/** Trecho do compromisso que cai em `dia`, em minutos desde 00:00. Sem fim: 30 min. */
const trecho = (e: EventoAgenda, dia: string) => {
  const de = e.inicio.slice(0, 10) < dia ? 0 : minutos(e.inicio.slice(11, 16));
  const fim = !e.fim ? de + PASSO : e.fim.slice(0, 10) > dia ? 1440 : e.fim.slice(0, 10) < dia ? de + PASSO : minutos(e.fim.slice(11, 16));
  return { de, ate: Math.max(fim, de + 1) };
};

/** Dia inteiro vai para a faixa de cima; o resto, para as linhas; o que cai todo fora de 07:00 às 22:30 fica só na agenda da direita. */
export function separarCompromissos(eventos: EventoAgenda[], dia: string) {
  const faixa = eventos.filter((e) => e.diaInteiro);
  const horas = eventos.filter((e) => { if (e.diaInteiro) return false; const { de, ate } = trecho(e, dia); return ate > PRIMEIRA && de < FIM_GRADE; });
  return { faixa, horas };
}

export type Encaixe = { evento: EventoAgenda; /** "HH:MM" onde começa neste dia. */ inicio: string; fim: string; /** false = linha de baixo de um compromisso longo (só pintada). */ primeira: boolean };

/**
 * Põe cada compromisso na linha da meia hora em que começa (11:15 vai para 11:00) e pinta as linhas que ele ocupa.
 * A tarefa já está no lugar dela: se a linha do início está ocupada, o compromisso desce para a próxima livre, e um compromisso
 * longo para de pintar quando encontra uma linha ocupada. Entrada: `grade` de `montarGrade` e `horas` já em ordem de início.
 */
export function encaixarCompromissos(grade: (Tarefa | null)[], horas: EventoAgenda[], dia: string): (Tarefa | Encaixe | null)[] {
  const linhas: (Tarefa | Encaixe | undefined)[] = grade.map((l) => l ?? undefined);
  const clamp = (k: number) => Math.min(SLOTS - 1, Math.max(0, k));
  for (const e of horas) {
    const { de, ate } = trecho(e, dia);
    const k0 = clamp(Math.floor((de - PRIMEIRA) / PASSO));
    const n = Math.max(1, Math.ceil((Math.min(ate, FIM_GRADE) - Math.max(de, PRIMEIRA)) / PASSO)); // linhas pela duração: 11:15 às 11:45 é uma linha só
    const dados = { evento: e, inicio: hhmm(de), fim: hhmm(Math.min(ate, 1439)) };
    let k = k0;
    while (linhas[k]) k++;
    linhas[k] = { ...dados, primeira: true };
    for (let j = k + 1; j < k + n && j < SLOTS && !linhas[j]; j++) linhas[j] = { ...dados, primeira: false };
  }
  return Array.from({ length: Math.max(SLOTS, linhas.length + 1) }, (_, k) => linhas[k] ?? null);
}
