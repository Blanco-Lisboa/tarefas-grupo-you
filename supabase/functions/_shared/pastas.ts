// Regras das pastas do Drive (item 229), sem dependência nenhuma: a função `drive` (Deno) e a tela (Next) importam deste mesmo arquivo,
// para o nome da pasta e a conta dos 7 dias nunca divergirem. Árvore: Tarefas · Conteúdos → Empresa → Formato → Tema → pasta do conteúdo.
export const FORMATOS = ["reels", "carrossel", "post", "story"] as const;
export type FormatoPasta = (typeof FORMATOS)[number];

export const SEM_FORMATO = "Sem formato";
export const SEM_TEMA = "Sem tema";
/** Dias entre o card virar Postado e o Drive mandar os arquivos dele para a lixeira (a regra em si mora no banco: gatilho tarefas_alarmes, 019). */
export const DIAS_PARA_LIMPAR = 7;
export const MINUTOS_PARA_LIMPAR = DIAS_PARA_LIMPAR * 24 * 60;

export const NOME_FORMATO: Record<FormatoPasta, string> = { reels: "Reels", carrossel: "Carrossel", post: "Post", story: "Stories" };

export const formatoValido = (f: unknown): f is FormatoPasta => typeof f === "string" && (FORMATOS as readonly string[]).includes(f);
/** Pedaço da chave em drive_pastas: o formato, ou "sem". */
export const chaveFormato = (f: unknown): string => (formatoValido(f) ? f : "sem");
export const nomeFormato = (f: unknown): string => (formatoValido(f) ? NOME_FORMATO[f] : SEM_FORMATO);

/** Chaves da tabela drive_pastas (só a função `drive` lê e escreve nela). */
export const chaves = {
  empresa: (empresa: string) => `empresa:${empresa}`,
  formato: (empresa: string, formato: unknown) => `formato:${empresa}:${chaveFormato(formato)}`,
  tema: (tema: string | null | undefined, empresa: string, formato: unknown) => `tema:${tema || "sem"}:${empresa}:${chaveFormato(formato)}`,
  conteudo: (tarefa: string) => `card:${tarefa}`,
};

const limpo = (s: string) => s.replace(/\s+/g, " ").trim();
/** "<Formato> <tema> - <título>". Sem tema: "<Formato> - <título>". Sem formato, o formato some do nome. Cabe no limite de nome do Drive. */
export function nomePastaConteudo(formato: unknown, tema: string | null | undefined, titulo: string): string {
  const frente = [formatoValido(formato) ? NOME_FORMATO[formato] : "", tema ?? ""].map(limpo).filter(Boolean).join(" ");
  const nome = limpo(titulo) || "Sem título";
  return (frente ? `${frente} - ${nome}` : nome).slice(0, 200);
}
