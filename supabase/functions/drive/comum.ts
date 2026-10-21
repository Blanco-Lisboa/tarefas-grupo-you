// Erro com código HTTP e mensagem pronta para a tela: a função `drive` o transforma em resposta.
export class Recusa extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
  }
}
export const TIPOS = ["imagem", "video", "documento"];
export const MAX_BYTES = 5 * 1024 ** 3;
export const nomeOk = (n: unknown, max = 120) => (typeof n === "string" && n.trim() && n.trim().length <= max ? n.trim() : undefined);
export const texto = (v: unknown) => (typeof v === "string" ? v : undefined);
