import { describe, expect, it } from "vitest";
import type { NovaTarefa } from "@/lib/dados";
import { arrumar, ehQuemAprova } from "./arrumar";

describe("ficha: o que vai para o banco ao salvar (Lupa R6-1)", () => {
  const t: NovaTarefa = {
    titulo: "  Post  ", tipo: "postagem", empresaId: "", responsavel: "natham", diaInteiro: false, cor: "etiqueta-1", links: [], arquivos: [],
    aprovador: "Natham", objetivo: "  vender  ", notas: "  nota  ",
  };

  it("tirou a tag de aprovação: o aprovador sai; título, objetivo e notas sem espaços nas pontas; extras entram", () => {
    expect(arrumar(t, false, { inicio: "2026-10-21", vaiProGoogle: true })).toMatchObject({
      aprovador: undefined, titulo: "Post", objetivo: "vender", notas: "nota", inicio: "2026-10-21", vaiProGoogle: true,
    });
  });
  it("com a tag, o aprovador fica; fora de postagem o objetivo sai; notas só de espaços somem", () => {
    expect(arrumar({ ...t, tipo: "outro", notas: "   " }, true)).toMatchObject({ aprovador: "Natham", objetivo: undefined, notas: undefined });
  });
});

describe("ehQuemAprova (015)", () => {
  it("Natham sempre; os outros só se forem o aprovador; sem aprovador só o Natham", () => {
    expect(ehQuemAprova("Matheus", "natham")).toBe(true);
    expect(ehQuemAprova(" matheus ", "matheus")).toBe(true);
    expect(ehQuemAprova("Natham", "matheus")).toBe(false);
    expect(ehQuemAprova(undefined, "matheus")).toBe(false);
    expect(ehQuemAprova("Matheus", null)).toBe(false);
  });
});
