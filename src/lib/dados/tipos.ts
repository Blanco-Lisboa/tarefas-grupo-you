// Modelo único: a tarefa. Conteúdo é um TIPO de tarefa, não uma tabela à parte.
export const TIPOS = ["ideia", "roteiro", "gravacao", "edicao", "postagem", "reuniao", "outro"] as const;
export const REDES = ["instagram", "tiktok", "youtube", "kwai"] as const;
export const ETAPAS = ["roteiro", "gravacao", "edicao", "analise", "aprovado", "postado"] as const;
export const RESPONSAVEIS = ["natham", "matheus", "adrian", "lucas"] as const; // as 4 pessoas do banco; só Natham e Matheus têm login
export const ETIQUETAS = [
  "etiqueta-1", "etiqueta-2", "etiqueta-3", "etiqueta-4", "etiqueta-5",
  "etiqueta-6", "etiqueta-7", "etiqueta-8", "etiqueta-9", "etiqueta-10",
  "etiqueta-11", "etiqueta-12", "etiqueta-13", "etiqueta-14", "etiqueta-15", "etiqueta-16",
] as const;

export type TipoTarefa = (typeof TIPOS)[number];
export type Rede = (typeof REDES)[number];
export type Etapa = (typeof ETAPAS)[number];
export type Responsavel = (typeof RESPONSAVEIS)[number];
export type Etiqueta = (typeof ETIQUETAS)[number]; // usa var(--etiqueta-N) e var(--etiqueta-N-texto)

export type Link = { rotulo: string; url: string }; // vídeo = link do Google Drive
/** Anexo da ficha (imagem ou vídeo). Hoje url = endereço temporário na memória do navegador; guardar de verdade depende do banco (Fase 2). */
export type Arquivo = { nome: string; url?: string; tipo?: "imagem" | "video" };

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
  /** Feita? Opcional: ausente = não concluída. */
  concluida?: boolean;
  /** Para que serve o conteúdo (só postagem usa): aparece no Mapa. */
  objetivo?: string;
  notas?: string;
  links: Link[];
  arquivos: Arquivo[];
  /** Ids das tags marcadas (ver Tag). */
  tags?: string[];
  /** Quem aprova este conteúdo (nome livre). Só vale com uma tag de aprovação marcada; fica no conteúdo, não na tag. */
  aprovador?: string;
  /** Vêm do banco, só leitura. dono = de quem é o caderno; enviadaPor = quem mandou (só se foi enviada). */
  dono?: Responsavel;
  criadoPor?: Responsavel;
  enviadaPor?: Responsavel;
  /** Vai para a agenda do Google do responsável (volta da agenda, 010). Só o Calendário liga isto, ao CRIAR a tarefa; depois não muda (o banco trava). Tarefa do Caderno nunca vai. */
  vaiProGoogle?: boolean;
};

/** Rótulo colorido que se cria e se marca nos conteúdos. aprovacao = marcar pede "Quem aprova". */
export type Tag = { id: string; nome: string; cor: Etiqueta; aprovacao?: boolean };
/** Quem aprova por padrão; outros nomes entram pela ficha. */
export const APROVADORES = ["Natham", "Matheus", "Adrian"] as const;

export type Empresa = { id: string; nome: string; sigla: string };

/** enviarPara (só ao criar): entrega a tarefa no caderno dessa pessoa; o banco registra quem mandou. Sem ele, fica no seu caderno. */
export type NovaTarefa = Omit<Tarefa, "id"> & { id?: string; enviarPara?: Responsavel };

/** Selo "fazendo agora": quem marcou a tarefa e desde quando (ISO). */
export type Fazendo = { quem: Responsavel; desde: string };
