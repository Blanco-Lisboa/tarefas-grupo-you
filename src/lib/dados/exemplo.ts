// DADOS DE EXEMPLO (Fase 1). Só o repositório deste diretório importa este arquivo; telas nunca.
import { REDES, type Empresa, type Etapa, type Etiqueta, type Rede, type Responsavel, type Tarefa, type TipoTarefa } from "./tipos";

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

// Postagens de todos os dias de 01/10 a 30/11, geradas UMA vez com semente fixa (mesma lista a cada abertura, sem Math.random).
// Cada dia fecha com 1 a 3 postagens (contando as da lista acima), das duas empresas, em etapas que dependem da distância de HOJE_EXEMPLO.
const HOJE_EXEMPLO = "2026-10-19";
const FORMATOS: Record<Rede, string[]> = {
  instagram: ["Reels", "Carrossel", "Story"], tiktok: ["TikTok"], youtube: ["Vídeo", "Shorts"], kwai: ["Kwai"],
};
const TEMAS: Record<string, string[]> = {
  you: ["dica de MEI", "erro comum no imposto", "como emitir nota", "pró-labore explicado", "bastidores do escritório", "pergunta de cliente", "calendário fiscal", "mito ou verdade", "abrir CNPJ", "Simples Nacional sem susto"],
  beec: ["bastidores da Beec", "depoimento de cliente", "antes e depois", "tabela de preços", "organização financeira", "corte do podcast", "dia da equipe", "novidade do serviço", "pergunta da semana", "caso de sucesso"],
};
const OBJETIVOS_GERADOS = [
  "Educar o público e gerar pedidos de orçamento", "Aproximar quem nos segue da equipe", "Ganhar alcance com um tema em alta",
  "Engajar a base com uma pergunta rápida", "Mostrar um caso real e gerar confiança", "Reforçar a marca e lembrar o que fazemos",
];

function semente(a: number) { // mulberry32: mesma sequência para a mesma semente
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const geradasObjetivo: Record<number, string> = {};
const geradas: Linha[] = (() => {
  const sorteio = semente(20261019);
  const escolhe = <T,>(l: readonly T[]) => l[Math.floor(sorteio() * l.length)];
  const porDia = new Map<string, number>();
  for (const l of linhas) if (l[2] === "postagem" && l[7]) porDia.set(l[7].slice(0, 10), (porDia.get(l[7].slice(0, 10)) ?? 0) + 1);
  const saida: Linha[] = [];
  let n = linhas.length;
  for (let i = 0; i < 61; i++) {
    const dia = new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10); // só aritmética de calendário em UTC, sem fuso
    const r = sorteio();
    const alvo = r < 0.45 ? 1 : r < 0.85 ? 2 : 3;
    for (let k = porDia.get(dia) ?? 0; k < alvo; k++) {
      const empresa = sorteio() < 0.5 ? "you" : "beec";
      const rede = escolhe(REDES);
      const dist = Math.round((Date.parse(dia) - Date.parse(HOJE_EXEMPLO)) / 86400000);
      const etapa: Etapa = dist < 0 ? "postado" : dist <= 3 ? escolhe(["aprovado", "edicao"] as const) : dist <= 9 ? escolhe(["edicao", "gravacao", "aprovado"] as const) : escolhe(["roteiro", "gravacao", "edicao"] as const);
      const hora = String(8 + Math.floor(sorteio() * 12)).padStart(2, "0");
      n++;
      geradasObjetivo[n] = escolhe(OBJETIVOS_GERADOS);
      saida.push([n, `${escolhe(FORMATOS[rede])}: ${escolhe(TEMAS[empresa])}`, "postagem", empresa, rede, etapa, sorteio() < 0.5 ? "natham" : "matheus", `${dia}T${hora}:00`, "", 1 + Math.floor(sorteio() * 10)]);
    }
  }
  return saida;
})();

// Objetivo das postagens (aparece no Mapa).
const OBJETIVOS: Record<number, string> = {
  ...geradasObjetivo,
  5: "Mostrar a equipe por trás da Beec e aproximar quem nos segue",
  9: "Educar o público sobre erros comuns e gerar pedidos de orçamento",
  16: "Humanizar a profissão e ganhar alcance no TikTok",
  18: "Dar nova vida ao podcast e alcançar o público do Kwai",
  22: "Engajar a base com uma enquete rápida",
  24: "Celebrar o Dia do Contador e reforçar a marca",
  28: "Começar a série de dicas e atrair novos MEIs",
  29: "Levar a primeira dica de MEI ao público do TikTok",
  34: "Apresentar a Beec e o que ela faz em um vídeo só",
  37: "Converter a atenção da Black Friday em vendas",
};

// Tarefas antigas (início de outubro) já feitas.
const CONCLUIDAS = new Set([1, 2, 3, 4]);

export const tarefasExemplo: Tarefa[] = [...linhas, ...geradas].map(([n, titulo, tipo, empresaId, rede, etapa, responsavel, inicio, fim, cor]) => ({
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
  ...(CONCLUIDAS.has(n) && { concluida: true }),
}));
