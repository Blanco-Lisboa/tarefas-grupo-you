import { describe, expect, it } from "vitest";
import type { Tarefa } from "@/lib/dados";
import { doCaderno, montarGrade, msAteMeiaNoite, rotuloSlot, SLOTS } from "./grade";
import { notaDaChave } from "./notas";

const t = (id: string, inicio?: string, diaInteiro = false) =>
  ({ id, titulo: id, tipo: "outro", empresaId: "e", responsavel: "natham", inicio, diaInteiro, cor: "etiqueta-1", links: [], arquivos: [] }) as Tarefa;

describe("grade do caderno", () => {
  it("rotula de 07:00 a 22:00", () => {
    expect(rotuloSlot(0)).toBe("07:00");
    expect(rotuloSlot(SLOTS - 1)).toBe("22:00");
    expect(rotuloSlot(SLOTS)).toBe("");
  });
  it("põe cada tarefa na linha da hora, desce se ocupada, e dia inteiro vai para a primeira livre", () => {
    const g = montarGrade([t("a", "2026-10-20T06:00"), t("b", "2026-10-20T07:10"), t("c", "2026-10-20T09:30"), t("d", "2026-10-20", true)], true);
    expect(g.length).toBe(SLOTS);
    expect(g[0]?.id).toBe("a");
    expect(g[1]?.id).toBe("b");
    expect(g[5]?.id).toBe("c");
    expect(g[2]?.id).toBe("d");
  });
  it("sem porHora ignora o horário e mantém a ordem", () => {
    const g = montarGrade([t("a", "2026-10-20T20:00"), t("b")], false);
    expect([g[0]?.id, g[1]?.id]).toEqual(["a", "b"]);
  });
});

describe("anotações do dia", () => {
  const armazem = { getItem: (k: string) => ({ "d:20": "nota do 20", "d:21": "nota do 21" } as Record<string, string>)[k] ?? null, setItem: () => {} };
  it("trocar de dia mostra a nota do dia novo, não a do anterior", () => {
    const dia20 = notaDaChave(null, "d:20", armazem);
    expect(dia20.valor).toBe("nota do 20");
    expect(notaDaChave(dia20, "d:21", armazem).valor).toBe("nota do 21");
    expect(notaDaChave(dia20, "d:22", armazem).valor).toBe("");
  });
  it("mesma chave mantém o que está sendo digitado", () => {
    expect(notaDaChave({ chave: "d:20", valor: "digitando" }, "d:20", armazem).valor).toBe("digitando");
  });
});

describe("virada da meia-noite", () => {
  it("conta até a próxima meia-noite local", () => {
    expect(msAteMeiaNoite(new Date(2026, 9, 19, 23, 59, 0))).toBe(60_500);
    expect(msAteMeiaNoite(new Date(2026, 9, 19, 0, 0, 0))).toBe(86_400_500);
  });
});

describe("de quem é o caderno", () => {
  const priv = { ...t("p"), empresaId: undefined, dono: "natham", responsavel: "matheus" } as unknown as Tarefa;
  const conteudo = { ...t("c"), etapa: "roteiro", dono: "natham", responsavel: "matheus" } as Tarefa;
  it("privada segue o dono, não o responsável", () => {
    expect(doCaderno(priv, "natham")).toBe(true);
    expect(doCaderno(priv, "matheus")).toBe(false);
  });
  it("sem dono cai no responsável; sem `de` mostra tudo", () => {
    expect(doCaderno({ ...priv, dono: undefined }, "matheus")).toBe(true);
    expect(doCaderno(priv, null)).toBe(true);
  });
  it("conteúdo com empresa segue o responsável", () => {
    expect(doCaderno(conteudo, "matheus")).toBe(true);
    expect(doCaderno(conteudo, "natham")).toBe(false);
  });
});
