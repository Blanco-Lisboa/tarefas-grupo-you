import { describe, expect, it } from "vitest";
import type { Tarefa } from "@/lib/dados";
import { montarGrade, rotuloSlot, SLOTS } from "./grade";

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
