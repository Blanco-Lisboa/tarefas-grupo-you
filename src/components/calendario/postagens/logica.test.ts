import { describe, expect, it } from "vitest";
import type { Ocorrencia, Planejada } from "@/lib/dados";
import { comODia, faltaPreencher, HORAS, paraGravar, periodoDe, planejadaNova, porDiaPostagens, soHoraQuemTitulo } from "./logica";

const o = (dia: string, hora: string, empresaId: string): Ocorrencia => ({ dia, hora, empresaId, estado: "planejada" });

describe("periodoDe", () => {
  it("semana: domingo a sábado", () => {
    const p = periodoDe("semana", "2026-10-28");
    expect([p.de, p.ate, p.dias.length]).toEqual(["2026-10-25", "2026-10-31", 7]);
  });
  it("mês: semanas inteiras que cobrem o mês", () => {
    const p = periodoDe("mes", "2026-10-15");
    expect([p.de, p.ate]).toEqual(["2026-09-27", "2026-10-31"]);
  });
});

describe("porDiaPostagens", () => {
  it("ordena por hora e, no empate, por empresa", () => {
    const m = porDiaPostagens([o("2026-10-26", "17:00", "you"), o("2026-10-26", "09:00", "you"), o("2026-10-26", "17:00", "beec")]);
    expect(m.get("2026-10-26")!.map((x) => `${x.hora}${x.empresaId}`)).toEqual(["09:00you", "17:00beec", "17:00you"]);
  });
});

describe("faltaPreencher", () => {
  const base = planejadaNova("2026-10-26");
  it("pede empresa", () => expect(faltaPreencher(base)).toMatch(/empresa/));
  it("data avulsa pronta", () => expect(faltaPreencher({ ...base, empresaId: "you" })).toBe(""));
  it("toda semana pede dias e confere o fim", () => {
    const s: Planejada = { ...base, empresaId: "you", repete: "semana" };
    expect(faltaPreencher(s)).toMatch(/dias/);
    expect(faltaPreencher({ ...s, diasSemana: [1], fim: "2026-10-01", inicio: "2026-10-26" })).toMatch(/fim/);
    expect(faltaPreencher({ ...s, diasSemana: [1], inicio: "2026-10-26" })).toBe("");
  });
  it("sem rede não salva", () => expect(faltaPreencher({ ...base, empresaId: "you", redes: [] })).toMatch(/rede/));
});

describe("soHoraQuemTitulo", () => {
  const a: Planejada = { ...planejadaNova("2026-10-26"), empresaId: "you", repete: "semana", diasSemana: [1, 3], inicio: "2026-10-01" };
  it("hora, quem faz e título não impedem 'só este dia'", () => expect(soHoraQuemTitulo(a, { ...a, hora: "18:00", responsavel: "natham", titulo: "x" })).toBe(true));
  it("formato ou dias impedem", () => {
    expect(soHoraQuemTitulo(a, { ...a, formato: "post" })).toBe(false);
    expect(soHoraQuemTitulo(a, { ...a, diasSemana: [1] })).toBe(false);
  });
});

it("horas vão de 07:00 a 22:00", () => expect([HORAS[0], HORAS.at(-1), HORAS.length]).toEqual(["07:00", "22:00", 31]));

describe("Lupa 315: dia com \"só este dia\" na ficha", () => {
  const serie: Planejada = { ...planejadaNova("2026-11-02"), id: "s", empresaId: "you", repete: "semana", diasSemana: [1, 3], hora: "17:00", titulo: "" };
  const dia = comODia(serie, { hora: "18:30", responsavel: "natham", titulo: "Só hoje" });
  it("abre mostrando hora, quem e título do DIA", () => expect([dia.hora, dia.responsavel, dia.titulo]).toEqual(["18:30", "natham", "Só hoje"]));
  it("todos/próximos: o que não foi mexido volta a ser da série; o que foi mexido vai", () => {
    const g = paraGravar(serie, dia, { ...dia, titulo: "Novo para todos" }, "todos");
    expect([g.hora, g.responsavel, g.titulo, g.diasSemana]).toEqual(["17:00", "matheus", "Novo para todos", [1, 3]]);
  });
  it("só este dia grava o que está na ficha", () => expect(paraGravar(serie, dia, { ...dia, hora: "19:00" }, "dia").hora).toBe("19:00"));
  it("dia sem exceção: nada muda", () => expect(paraGravar(serie, comODia(serie, { hora: "17:00" }), comODia(serie, { hora: "17:00" }), "todos")).toEqual(serie));
});
