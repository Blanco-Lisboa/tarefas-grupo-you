import { describe, expect, it } from "vitest";
import { campoConsertoTexto, fecharAprovada, semTagDeAprovacao } from "./esteira";
import type { Tag } from "./tipos";

const tags: Tag[] = [
  { id: "esperando", nome: "Esperando aprovação", cor: "etiqueta-1", aprovacao: true },
  { id: "urgente", nome: "Urgente", cor: "etiqueta-2" },
];

describe("semTagDeAprovacao (272)", () => {
  it("tira só a tag de aprovação", () => expect(semTagDeAprovacao(["esperando", "urgente"], tags)).toEqual(["urgente"]));
  it("sem sobra devolve undefined", () => expect(semTagDeAprovacao(["esperando"], tags)).toBeUndefined());
  it("sem tags devolve undefined; tag desconhecida fica", () => {
    expect(semTagDeAprovacao(undefined, tags)).toBeUndefined();
    expect(semTagDeAprovacao(["outra"], tags)).toEqual(["outra"]);
  });
});

describe("fecharAprovada (272, 271)", () => {
  it("Aprovado: tira a tag de aprovação e fecha o conserto", () =>
    expect(fecharAprovada({ etapa: "aprovado", tags: ["esperando", "urgente"], consertoTexto: "cortar o início" }, tags)).toEqual({ tags: ["urgente"], consertoTexto: "" }));
  it("Aprovado sem a coluna do conserto: continua undefined", () =>
    expect(fecharAprovada({ etapa: "aprovado", tags: ["esperando"] }, tags)).toEqual({ tags: undefined, consertoTexto: undefined }));
  it("outra etapa não muda nada", () =>
    expect(fecharAprovada({ etapa: "analise", tags: ["esperando"], consertoTexto: "x" }, tags)).toEqual({ tags: ["esperando"], consertoTexto: "x" }));
});

describe("campoConsertoTexto (271)", () => {
  it("texto novo manda, aparado", () => expect(campoConsertoTexto("  trocar a música ", undefined)).toEqual({ conserto_texto: "trocar a música" }));
  it("texto tirado manda null", () => expect(campoConsertoTexto("", "trocar a música")).toEqual({ conserto_texto: null }));
  it("nunca teve: não manda a coluna", () => expect(campoConsertoTexto(undefined, "")).toEqual({}));
});
