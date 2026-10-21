// Erro com código HTTP e mensagem pronta para a tela: a função `drive` o transforma em resposta.
export class Recusa extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
  }
}
