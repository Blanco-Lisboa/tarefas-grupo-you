// Peças prontas (Fase 1: exemplo). Uma peça é um arquivo finalizado de uma empresa, guardado numa pasta por tipo.
// Na Fase 2 só este arquivo troca por Supabase/Drive; a tela não muda.
export const TIPOS_PECA = ["post", "carrossel", "video", "story"] as const;
export type TipoPeca = (typeof TIPOS_PECA)[number];

export type Peca = {
  id: string;
  empresaId: string;
  tipo: TipoPeca;
  titulo: string;
  /** Segunda linha do arquivo: formato, tamanho, duração. */
  meta?: string;
  /** Vídeo = link do Google Drive. Imagem não tem link: baixa pelo sistema. */
  link?: string;
};

const p = (empresaId: string, tipo: TipoPeca, n: number, titulo: string, meta: string, link?: string): Peca => ({
  id: `${empresaId}-${tipo}-${n}`, empresaId, tipo, titulo, meta, link,
});
const drive = (id: string) => `https://drive.google.com/file/d/${id}/view`;

export const pecasExemplo: Peca[] = [
  p("beec", "post", 1, "Dica de organização", "PNG 1080x1350"),
  p("beec", "post", 2, "Cliente do mês", "PNG 1080x1350"),
  p("beec", "post", 3, "Aviso de prazo", "PNG 1080x1350"),
  p("beec", "carrossel", 1, "5 erros no caixa", "7 imagens"),
  p("beec", "carrossel", 2, "Passo a passo do fechamento", "9 imagens"),
  p("beec", "video", 1, "Bastidores da equipe", "MP4 0:48", drive("exemplo-beec-1")),
  p("beec", "video", 2, "Reels: o que muda em novembro", "MP4 0:32", drive("exemplo-beec-2")),
  p("beec", "story", 1, "Enquete da semana", "PNG 1080x1920"),
  p("beec", "story", 2, "Contagem regressiva", "PNG 1080x1920"),
  p("you", "post", 1, "Boas-vindas ao novo cliente", "PNG 1080x1350"),
  p("you", "post", 2, "Resumo do mês", "PNG 1080x1350"),
  p("you", "carrossel", 1, "Como abrir uma empresa", "8 imagens"),
  p("you", "carrossel", 2, "Impostos sem susto", "6 imagens"),
  p("you", "carrossel", 3, "Checklist do MEI", "5 imagens"),
  p("you", "video", 1, "Explicando o Simples Nacional", "MP4 1:12", drive("exemplo-you-1")),
  p("you", "story", 1, "Pergunte ao contador", "PNG 1080x1920"),
  p("you", "story", 2, "Prazo da declaração", "PNG 1080x1920"),
  p("you", "story", 3, "Depoimento", "PNG 1080x1920"),
];

/** Todas as peças. Na Fase 2 vira leitura reativa, como useTarefas. */
export const usePecas = () => pecasExemplo;
