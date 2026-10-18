// Modelo único: a tarefa. Conteúdo é um TIPO de tarefa, não uma tabela à parte.
export const TIPOS = ["ideia", "roteiro", "gravacao", "edicao", "postagem", "reuniao", "outro"] as const;
export const REDES = ["instagram", "tiktok", "youtube", "kwai"] as const;
export const ETAPAS = ["ideia", "roteiro", "gravacao", "edicao", "aprovado", "postado"] as const;
export const RESPONSAVEIS = ["natham", "matheus"] as const;
export const ETIQUETAS = [
  "etiqueta-1", "etiqueta-2", "etiqueta-3", "etiqueta-4", "etiqueta-5",
  "etiqueta-6", "etiqueta-7", "etiqueta-8", "etiqueta-9", "etiqueta-10",
] as const;

export type TipoTarefa = (typeof TIPOS)[number];
export type Rede = (typeof REDES)[number];
export type Etapa = (typeof ETAPAS)[number];
export type Responsavel = (typeof RESPONSAVEIS)[number];
export type Etiqueta = (typeof ETIQUETAS)[number]; // usa var(--etiqueta-N) e var(--etiqueta-N-texto)

export type Link = { rotulo: string; url: string }; // vídeo = link do Google Drive
export type Arquivo = { nome: string; url?: string }; // imagem/carrossel guardado no sistema (Fase 2)

export type Tarefa = {
  id: string;
  titulo: string;
  tipo: TipoTarefa;
  empresaId: string;
  rede?: Rede;
  etapa?: Etapa;
  responsavel: Responsavel;
  /** Data/hora local sem fuso: "2026-10-21T14:00" (ou "2026-10-21" se diaInteiro). Sem início = "sem data". */
  inicio?: string;
  fim?: string;
  diaInteiro: boolean;
  cor: Etiqueta;
  notas?: string;
  links: Link[];
  arquivos: Arquivo[];
};

export type Empresa = { id: string; nome: string; sigla: string };

export type NovaTarefa = Omit<Tarefa, "id"> & { id?: string };
