import { describe, expect, it } from "vitest";
import type { NovaTarefa } from "@/lib/dados";
import { arrumar, ehQuemAprova, etapaAoSalvar, mudouPasta, podeTrocarAprovador, trocarEmpresa } from "./arrumar";

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

describe("podeTrocarAprovador (223)", () => {
  it("o Matheus escolhe quem aprova em card do Natham, de outro ou sem aprovador; Natham sempre; os outros só se forem o aprovador", () => {
    expect(podeTrocarAprovador("Natham", "matheus")).toBe(true);
    expect(podeTrocarAprovador(undefined, "matheus")).toBe(true);
    expect(podeTrocarAprovador("Adrian", "matheus")).toBe(true);
    expect(podeTrocarAprovador(undefined, "natham")).toBe(true);
    expect(podeTrocarAprovador("Adrian", "adrian")).toBe(true);
    expect(podeTrocarAprovador("Natham", "adrian")).toBe(false);
    expect(podeTrocarAprovador(undefined, "lucas")).toBe(false);
    expect(podeTrocarAprovador("Natham", null)).toBe(false);
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

describe("mudouPasta (229)", () => {
  const card: NovaTarefa = { titulo: "Reels", tipo: "postagem", empresaId: "you", responsavel: "natham", diaInteiro: false, cor: "etiqueta-1", links: [], arquivos: [], formato: "reels", ocasiaoId: "o1" };
  it("título, formato, tema ou empresa mudou: reorganiza; o resto (notas) ou tema vazio igual a nenhum, não", () => {
    expect(mudouPasta(card, { ...card, titulo: "Reels novo" })).toBe(true);
    expect(mudouPasta(card, { ...card, formato: "post" })).toBe(true);
    expect(mudouPasta(card, { ...card, ocasiaoId: undefined })).toBe(true);
    expect(mudouPasta(card, { ...card, empresaId: "beec" })).toBe(true);
    expect(mudouPasta(card, { ...card, notas: "x" })).toBe(false);
    expect(mudouPasta({ ...card, ocasiaoId: undefined }, { ...card, ocasiaoId: "" })).toBe(false);
  });
});

describe("trocarEmpresa (239)", () => {
  const card: NovaTarefa = { titulo: "Reels", tipo: "postagem", empresaId: "you", responsavel: "natham", diaInteiro: false, cor: "etiqueta-1", links: [], arquivos: [], ocasiaoId: "tema-you" };
  it("outra empresa (ou nenhuma) tira o Tema; a mesma empresa deixa como está", () => {
    expect(trocarEmpresa(card, "beec")).toMatchObject({ empresaId: "beec", ocasiaoId: undefined });
    expect(trocarEmpresa(card, "")).toMatchObject({ empresaId: "", ocasiaoId: undefined });
    expect(trocarEmpresa(card, "you")).toBe(card);
  });
});
