import { describe, expect, it } from "vitest";
import { confirmarPostado } from "./confirmar";

describe("confirmação de Postado na Esteira", () => {
  it("confirma somente o arraste manual que entra em Postado", () => {
    expect(confirmarPostado("aprovado", "postado")).toBe(true);
    expect(confirmarPostado("roteiro", "postado")).toBe(true);
    expect(confirmarPostado("postado", "postado")).toBe(false);
    expect(confirmarPostado("aprovado", "edicao")).toBe(false);
    expect(confirmarPostado("aprovado", null)).toBe(false);
  });
});
