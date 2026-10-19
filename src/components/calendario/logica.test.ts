import { describe, expect, it } from "vitest";
import type { Tarefa } from "@/lib/dados";
import { andar, diasCobertos, diasDoMes, esperarFimDoArraste, faixas, inicioSemana, mover, paraDia, tituloPeriodo } from "./logica";

const base: Tarefa = {
  id: "x", titulo: "Gravar", tipo: "gravacao", empresaId: "beec", responsavel: "matheus",
  inicio: "2026-10-09T14:00", fim: "2026-10-09T17:00", diaInteiro: false, cor: "etiqueta-3", links: [], arquivos: [],
};

describe("calendário", () => {
  it("usa o relógio local (23h50 continua no mesmo dia)", () => {
    expect(paraDia(new Date(2026, 9, 18, 23, 50))).toBe("2026-10-18");
  });

  it("monta semana e mês a partir do domingo", () => {
    expect(inicioSemana("2026-10-21")).toBe("2026-10-18");
    const mes = diasDoMes("2026-10-21");
    expect(mes[0]).toBe("2026-09-27");
    expect(mes.length % 7).toBe(0);
    expect(mes).toContain("2026-10-31");
  });

  it("anda de mês sem pular fevereiro", () => {
    expect(andar("mes", "2026-01-31", 1)).toBe("2026-02-01");
    expect(andar("semana", "2026-10-18", -1)).toBe("2026-10-11");
    expect(tituloPeriodo("semana", "2026-10-28")).toEqual(["25 a 31 de outubro", "2026"]);
    expect(tituloPeriodo("semana", "2026-10-01")[0]).toBe("27/09 a 3/10");
  });

  it("move mantendo a duração, a hora ou virando dia inteiro", () => {
    expect(mover(base, { dia: "2026-10-12", minuto: 600 })).toMatchObject({ inicio: "2026-10-12T10:00", fim: "2026-10-12T13:00" });
    expect(mover(base, { dia: "2026-10-20" })).toMatchObject({ inicio: "2026-10-20T14:00", fim: "2026-10-20T17:00" });
    expect(mover(base, { dia: "2026-10-20", diaInteiro: true })).toMatchObject({ inicio: "2026-10-20", fim: undefined, diaInteiro: true });
    expect(mover(base, null)).toMatchObject({ inicio: undefined, fim: undefined, diaInteiro: false });
    const semData = { ...base, inicio: undefined, fim: undefined };
    expect(mover(semData, { dia: "2026-10-20", minuto: 540 })).toMatchObject({ inicio: "2026-10-20T09:00", fim: "2026-10-20T10:00" });
    expect(mover(semData, { dia: "2026-10-20" })).toMatchObject({ inicio: "2026-10-20", diaInteiro: true });
  });

  it("espalha tarefa de vários dias e põe lado a lado as que se cruzam", () => {
    expect(diasCobertos({ ...base, fim: "2026-10-11T12:00" })).toEqual(["2026-10-09", "2026-10-10", "2026-10-11"]);
    const r = faixas([{ ini: 0, fim: 60 }, { ini: 30, fim: 90 }, { ini: 120, fim: 150 }]);
    expect(r.map((x) => [x.faixa, x.total])).toEqual([[0, 2], [1, 2], [0, 1]]);
  });

  it("fim do arraste: chama uma vez só e, parado (tela saiu), não chama mais", () => {
    const janela = new EventTarget();
    let vezes = 0;
    esperarFimDoArraste(janela, () => vezes++);
    janela.dispatchEvent(new Event("drop"));
    janela.dispatchEvent(new Event("dragend"));
    expect(vezes).toBe(1);
    const parar = esperarFimDoArraste(janela, () => vezes++);
    parar();
    janela.dispatchEvent(new Event("dragend"));
    expect(vezes).toBe(1);
  });
});
