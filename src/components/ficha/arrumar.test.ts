import { describe, expect, it } from "vitest";
import type { NovaTarefa } from "@/lib/dados";
import { arrumar, ehQuemAprova, etapaAoSalvar } from "./arrumar";

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

describe("ficha: etapa ao salvar sem o campo Etapa (item 205)", () => {
  const nova: NovaTarefa = { titulo: "Vídeo do mês", tipo: "outro", empresaId: "you", responsavel: "natham", diaInteiro: false, cor: "etiqueta-1", links: [], arquivos: [] };
  it("card novo com empresa entra em Roteiro; com etapa (+ da coluna) fica na dela", () => {
    expect([etapaAoSalvar(nova), etapaAoSalvar({ ...nova, etapa: "edicao" })]).toEqual(["roteiro", "edicao"]);
  });
  it("sem empresa, reunião ou tarefa que já existe (do Caderno): continua sem etapa", () => {
    expect([etapaAoSalvar({ ...nova, empresaId: "" }), etapaAoSalvar({ ...nova, titulo: "Reunião com cliente" }), etapaAoSalvar({ ...nova, id: "t1" })]).toEqual([undefined, undefined, undefined]);
  });
});
