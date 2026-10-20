import { describe, expect, it } from "vitest";
import { daLinhaEvento, horaDeBrasilia, type LinhaEvento } from "./agenda";

const linha: LinhaEvento = { id: "e1", fontes: ["contato", "natham"], titulo: "Reunião - Caderno", particular: false, inicio: "2026-10-22T17:00:00+00:00", fim: "2026-10-22T18:00:00+00:00", dia_inteiro: false, local: null };

describe("agenda: linha do banco -> evento da tela", () => {
  it("põe a hora em Brasília e some as agendas que a pessoa não vê", () => {
    expect(daLinhaEvento(linha, ["matheus", "contato"])).toEqual({
      id: "e1", titulo: "Reunião - Caderno", inicio: "2026-10-22T14:00", fim: "2026-10-22T15:00", diaInteiro: false, local: undefined, particular: false, fontes: ["contato"],
    });
    expect(daLinhaEvento(linha, ["natham", "contato"]).fontes).toEqual(["contato", "natham"]);
  });
  it("dia inteiro: só a data, e o fim é o último dia incluído (o Google manda o dia seguinte)", () => {
    const feriado = { ...linha, dia_inteiro: true, inicio: "2026-11-02T03:00:00+00:00", fim: "2026-11-03T03:00:00+00:00" };
    expect(daLinhaEvento(feriado, ["natham"])).toMatchObject({ inicio: "2026-11-02", fim: undefined, diaInteiro: true });
    expect(daLinhaEvento({ ...feriado, fim: "2026-11-05T03:00:00+00:00" }, ["natham"])).toMatchObject({ inicio: "2026-11-02", fim: "2026-11-04" });
  });
  it("sem fim, particular e local", () => {
    expect(daLinhaEvento({ ...linha, fim: null, particular: true, titulo: "Ocupado", local: "Estúdio" }, ["natham"])).toMatchObject({ fim: undefined, particular: true, titulo: "Ocupado", local: "Estúdio" });
  });
  it("meia-noite de Brasília não vira o dia anterior (3h da manhã em UTC)", () => {
    expect(horaDeBrasilia("2026-11-02T03:00:00+00:00")).toBe("2026-11-02T00:00");
  });
});
