// DADOS DE EXEMPLO (Fase 1). Só o repositório deste diretório importa este arquivo; telas nunca.
import type { Empresa, Etapa, Etiqueta, Rede, Responsavel, Tarefa, TipoTarefa } from "./tipos";

export const empresasExemplo: Empresa[] = [
  { id: "beec", nome: "Beec", sigla: "BE" },
  { id: "you", nome: "You", sigla: "YO" },
];

type Linha = [
  id: number, titulo: string, tipo: TipoTarefa, empresa: string, rede: Rede | "", etapa: Etapa | "",
  resp: Responsavel, inicio: string, fim: string, cor: number,
];

// inicio "" = sem data; sem "T" no início = dia inteiro
// Hoje do exemplo = 2026-10-19. Conteúdos (com etapa): 3 por etapa, 1 atrasado, 1 hoje/amanhã, 1 mais à frente (Postado: passado).
// Sem etapa (reunião, "outro") são tarefas do Caderno e ficam fora dessa conta.
const linhas: Linha[] = [
  [101, "Roteiro: 3 erros na contabilidade", "roteiro", "you", "youtube", "roteiro", "natham", "2026-10-16T09:00", "2026-10-16T10:30", 7],
  [102, "Roteiro: bastidores da Beec", "roteiro", "beec", "instagram", "roteiro", "matheus", "2026-10-20T10:00", "2026-10-20T11:30", 2],
  [103, "Roteiro: Dia do Contador", "roteiro", "you", "instagram", "roteiro", "natham", "2026-10-30", "", 1],
  [104, "Gravar entrevista com cliente", "gravacao", "beec", "youtube", "gravacao", "natham", "2026-10-15T14:00", "2026-10-15T17:00", 7],
  [105, "Gravar TikTok: dia de um contador", "gravacao", "you", "tiktok", "gravacao", "matheus", "2026-10-19T15:00", "2026-10-19T17:00", 10],
  [106, "Gravar série: 5 dicas para MEI", "gravacao", "you", "instagram", "gravacao", "natham", "2026-11-03T14:00", "2026-11-03T18:00", 3],
  [107, "Editar corte do podcast para o Kwai", "edicao", "beec", "kwai", "edicao", "matheus", "2026-10-17T09:00", "2026-10-17T12:00", 6],
  [108, "Editar carrossel de preços", "edicao", "beec", "instagram", "edicao", "natham", "2026-10-20T09:00", "2026-10-20T12:00", 2],
  [109, "Editar vídeo institucional da Beec", "edicao", "beec", "youtube", "edicao", "matheus", "2026-10-28T09:00", "2026-10-29T12:00", 7],
  [110, "Postar vídeo: nota fiscal passo a passo", "postagem", "you", "youtube", "aprovado", "matheus", "2026-10-17T12:00", "", 8],
  [111, "Postar corte no Kwai", "postagem", "beec", "kwai", "aprovado", "matheus", "2026-10-20T18:30", "", 6],
  [112, "Postar Reels: Dia do Contador", "postagem", "you", "instagram", "aprovado", "natham", "2026-10-31T11:00", "", 2],
  [113, "Postar bastidores da Beec", "postagem", "beec", "tiktok", "postado", "natham", "2026-10-13T19:00", "", 4],
  [114, "Story: enquete de segunda", "postagem", "you", "instagram", "postado", "natham", "2026-10-14T08:00", "", 4],
  [115, "Shorts: margem de lucro em 40 segundos", "postagem", "beec", "youtube", "postado", "matheus", "2026-10-16T10:00", "", 4],
  [10, "Reunião de pauta da semana", "reuniao", "beec", "", "", "natham", "2026-10-19T09:00", "2026-10-19T09:45", 5],
  [21, "Reunião com o Matheus: calendário de novembro", "reuniao", "you", "", "", "natham", "2026-10-28T16:00", "2026-10-28T17:00", 5],
  [33, "Reunião de aprovação dos vídeos", "reuniao", "beec", "", "", "natham", "2026-11-19T15:00", "2026-11-19T16:00", 5],
  [39, "Revisar identidade dos stories", "outro", "beec", "", "", "matheus", "", "", 8],
];

// Objetivo das postagens (aparece no Mapa).
const OBJETIVOS: Record<number, string> = {
  110: "Ensinar um passo a passo que gera pedidos de orçamento",
  111: "Dar nova vida ao podcast e alcançar o público do Kwai",
  112: "Celebrar o Dia do Contador e reforçar a marca",
  113: "Mostrar a equipe por trás da Beec e aproximar quem nos segue",
  114: "Engajar a base com uma enquete rápida",
};

export const tarefasExemplo: Tarefa[] = linhas.map(([n, titulo, tipo, empresaId, rede, etapa, responsavel, inicio, fim, cor]) => ({
  id: `t${String(n).padStart(2, "0")}`,
  titulo,
  tipo,
  empresaId,
  rede: rede || undefined,
  etapa: etapa || undefined,
  responsavel,
  inicio: inicio || undefined,
  fim: fim || undefined,
  diaInteiro: !!inicio && !inicio.includes("T"),
  cor: `etiqueta-${cor}` as Etiqueta,
  links: tipo === "edicao" || tipo === "postagem" ? [{ rotulo: "Vídeo no Drive", url: "https://drive.google.com/" }] : [],
  arquivos: [],
  ...(OBJETIVOS[n] && { objetivo: OBJETIVOS[n] }),
}));
