import { describe, expect, it, vi } from "vitest";
import { gravarIdeia, lerIdeias } from "./ideias";

describe("ideias quando o navegador não grava", () => {
  it("a ideia nova continua visível e a próxima edição parte dela", () => {
    // já existe um valor antigo guardado: é ele que não pode vencer a ideia nova
    const guardado = new Map([["grade-conteudo:ideias:v1", JSON.stringify({ beec: [{ id: "x", empresaId: "beec", categoria: "Ganchos", titulo: "Antiga", texto: "" }] })]]);
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => guardado.get(k) ?? null,
      setItem: () => { throw new DOMException("cota cheia", "QuotaExceededError"); },
    });
    const antes = 1;
    gravarIdeia("beec", { categoria: "Ganchos", titulo: "Ideia A", texto: "" });
    expect(lerIdeias("beec").map((i) => i.titulo)).toContain("Ideia A");
    gravarIdeia("beec", { categoria: "Ganchos", titulo: "Ideia B", texto: "" });
    const titulos = lerIdeias("beec").map((i) => i.titulo);
    expect(titulos).toEqual(expect.arrayContaining(["Ideia A", "Ideia B"]));
    expect(titulos.length).toBe(antes + 2);
    vi.unstubAllGlobals();
  });
});
