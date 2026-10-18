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
const linhas: Linha[] = [
  [1, "Ideias de Reels de outubro", "ideia", "beec", "instagram", "ideia", "natham", "2026-10-05", "", 1],
  [2, "Roteiro: bastidores da Beec", "roteiro", "beec", "instagram", "roteiro", "natham", "2026-10-07T10:00", "2026-10-07T11:30", 2],
  [3, "Gravar bastidores", "gravacao", "beec", "instagram", "gravacao", "matheus", "2026-10-09T14:00", "2026-10-09T17:00", 3],
  [4, "Editar bastidores", "edicao", "beec", "instagram", "edicao", "matheus", "2026-10-13T09:00", "2026-10-13T12:00", 3],
  [5, "Postar bastidores", "postagem", "beec", "instagram", "postado", "matheus", "2026-10-15T18:00", "", 4],
  [6, "Roteiro: 3 erros na contabilidade", "roteiro", "you", "youtube", "roteiro", "natham", "2026-10-08T09:00", "2026-10-08T10:30", 7],
  [7, "Gravar 3 erros na contabilidade", "gravacao", "you", "youtube", "gravacao", "natham", "2026-10-14T15:00", "2026-10-14T18:00", 8],
  [8, "Editar 3 erros na contabilidade", "edicao", "you", "youtube", "edicao", "matheus", "2026-10-16T09:00", "2026-10-16T13:00", 8],
  [9, "Postar 3 erros na contabilidade", "postagem", "you", "youtube", "aprovado", "matheus", "2026-10-20T12:00", "", 8],
  [10, "Reunião de pauta da semana", "reuniao", "beec", "", "", "natham", "2026-10-19T09:00", "2026-10-19T09:45", 5],
  [11, "Carrossel: tabela de preços", "ideia", "beec", "instagram", "ideia", "natham", "2026-10-19", "", 1],
  [12, "Arte do carrossel de preços", "edicao", "beec", "instagram", "edicao", "matheus", "2026-10-21T10:00", "2026-10-21T12:00", 2],
  [13, "TikTok: dia de um contador", "roteiro", "you", "tiktok", "roteiro", "natham", "2026-10-21T14:00", "2026-10-21T15:00", 9],
  [14, "Gravar TikTok: dia de um contador", "gravacao", "you", "tiktok", "gravacao", "matheus", "2026-10-22T10:00", "2026-10-22T12:00", 10],
  [15, "Editar TikTok: dia de um contador", "edicao", "you", "tiktok", "edicao", "matheus", "2026-10-23T14:00", "2026-10-23T17:00", 10],
  [16, "Postar TikTok: dia de um contador", "postagem", "you", "tiktok", "aprovado", "matheus", "2026-10-24T19:00", "", 10],
  [17, "Kwai: corte do podcast", "edicao", "beec", "kwai", "edicao", "matheus", "2026-10-22T15:00", "2026-10-22T16:30", 6],
  [18, "Postar corte no Kwai", "postagem", "beec", "kwai", "aprovado", "matheus", "2026-10-26T18:30", "", 6],
  [19, "Gravar entrevista com cliente", "gravacao", "beec", "youtube", "gravacao", "natham", "2026-10-27T09:00", "2026-10-27T12:00", 7],
  [20, "Editar entrevista com cliente", "edicao", "beec", "youtube", "edicao", "matheus", "2026-10-29T09:00", "2026-10-30T12:00", 7],
  [21, "Reunião com o Matheus: calendário de novembro", "reuniao", "you", "", "", "natham", "2026-10-28T16:00", "2026-10-28T17:00", 5],
  [22, "Story: enquete de segunda", "postagem", "you", "instagram", "postado", "natham", "2026-10-12T08:00", "", 4],
  [23, "Roteiro: Dia do Contador", "roteiro", "you", "instagram", "roteiro", "natham", "2026-10-30", "", 1],
  [24, "Reels: Dia do Contador", "postagem", "you", "instagram", "aprovado", "matheus", "2026-10-31T11:00", "", 2],
  [25, "Pauta de novembro", "ideia", "beec", "instagram", "ideia", "natham", "2026-11-02T09:00", "2026-11-02T10:00", 1],
  [26, "Gravar série: 5 dicas para MEI", "gravacao", "you", "instagram", "gravacao", "natham", "2026-11-03T14:00", "2026-11-03T18:00", 3],
  [27, "Editar série: 5 dicas para MEI", "edicao", "you", "instagram", "edicao", "matheus", "2026-11-05T09:00", "2026-11-06T12:00", 3],
  [28, "Postar dica 1 de MEI", "postagem", "you", "instagram", "aprovado", "matheus", "2026-11-09T12:00", "", 4],
  [29, "Postar dica 1 de MEI no TikTok", "postagem", "you", "tiktok", "aprovado", "matheus", "2026-11-09T12:30", "", 9],
  [30, "Carrossel: antes e depois", "roteiro", "beec", "instagram", "roteiro", "natham", "2026-11-10T10:00", "2026-11-10T11:00", 2],
  [31, "Gravar vídeo institucional da Beec", "gravacao", "beec", "youtube", "gravacao", "matheus", "2026-11-12T09:00", "2026-11-12T13:00", 7],
  [32, "Editar vídeo institucional da Beec", "edicao", "beec", "youtube", "edicao", "matheus", "2026-11-16T09:00", "2026-11-18T12:00", 7],
  [33, "Reunião de aprovação dos vídeos", "reuniao", "beec", "", "", "natham", "2026-11-19T15:00", "2026-11-19T16:00", 5],
  [34, "Postar vídeo institucional", "postagem", "beec", "youtube", "aprovado", "matheus", "2026-11-23T10:00", "", 7],
  [35, "Black Friday: ideias de campanha", "ideia", "beec", "kwai", "ideia", "natham", "2026-11-17", "", 6],
  [36, "Roteiro: Black Friday", "roteiro", "beec", "instagram", "roteiro", "natham", "2026-11-20T11:00", "2026-11-20T12:30", 2],
  [37, "Postar Black Friday", "postagem", "beec", "instagram", "aprovado", "matheus", "2026-11-27T08:00", "", 2],
  [38, "Ideia: bastidores do escritório", "ideia", "you", "", "ideia", "natham", "", "", 5],
  [39, "Revisar identidade dos stories", "outro", "beec", "", "", "matheus", "", "", 8],
  [40, "Ideia: quadro de perguntas dos clientes", "ideia", "you", "youtube", "ideia", "natham", "", "", 9],
  [41, "Roteiro solto: erros de folha de pagamento", "roteiro", "you", "tiktok", "roteiro", "natham", "", "", 10],
  [42, "Editar cortes antigos do podcast", "edicao", "beec", "kwai", "edicao", "matheus", "", "", 6],
];

// Tarefas antigas (início de outubro) já feitas.
const CONCLUIDAS = new Set([1, 2, 3, 4]);

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
  ...(CONCLUIDAS.has(n) && { concluida: true }),
}));
