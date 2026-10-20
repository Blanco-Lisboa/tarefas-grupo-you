import { describe, expect, it } from "vitest";
import { ETAPAS } from "@/lib/dados";
import { tipoDaColuna } from "./tipo";

describe("regras da Esteira", () => {
  it("cria o tipo correspondente a cada coluna", () => {
    expect(ETAPAS.map(tipoDaColuna)).toEqual([
      "roteiro", "gravacao", "edicao", "postagem", "postagem", "postagem",
    ]);
  });
});
