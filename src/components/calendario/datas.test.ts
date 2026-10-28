import { describe, expect, it } from "vitest";
import { datasDoAno, datasDoDia, pascoa } from "./datas";

const achar = (ano: number, nome: string) => datasDoAno(ano).filter((d) => d.nome === nome);
const dias = (ano: number, nome: string) => achar(ano, nome).map((d) => d.dia);

describe("datas importantes", () => {
  it("calcula a Páscoa de qualquer ano", () => {
    expect(pascoa(2024)).toBe("2024-03-31");
    expect(pascoa(2025)).toBe("2025-04-20");
    expect(pascoa(2026)).toBe("2026-04-05");
    expect(pascoa(2027)).toBe("2027-03-28");
    expect(pascoa(2038)).toBe("2038-04-25");
  });

  it("bate com a Portaria MGI 11.460/2025 em 2026", () => {
    expect(dias(2026, "Carnaval")).toEqual(["2026-02-16", "2026-02-17"]);
    expect(achar(2026, "Quarta-Feira de Cinzas")).toEqual([{ dia: "2026-02-18", nome: "Quarta-Feira de Cinzas", tipo: "feriado", aviso: "Ponto facultativo até 14h" }]);
    expect(dias(2026, "Paixão de Cristo")).toEqual(["2026-04-03"]);
    expect(dias(2026, "Corpus Christi")).toEqual(["2026-06-04"]);
    expect(datasDoAno(2026).filter((d) => d.tipo === "feriado" && !d.aviso)).toHaveLength(10);
  });

  it("acha as móveis de 2026 e 2027", () => {
    expect(dias(2027, "Carnaval")).toEqual(["2027-02-08", "2027-02-09"]);
    expect(dias(2027, "Paixão de Cristo")).toEqual(["2027-03-26"]);
    expect(dias(2027, "Corpus Christi")).toEqual(["2027-05-27"]);
    expect([dias(2026, "Dia das Mães"), dias(2027, "Dia das Mães")]).toEqual([["2026-05-10"], ["2027-05-09"]]);
    expect([dias(2026, "Dia dos Pais"), dias(2027, "Dia dos Pais")]).toEqual([["2026-08-09"], ["2027-08-08"]]);
    expect([dias(2026, "Black Friday"), dias(2027, "Black Friday")]).toEqual([["2026-11-27"], ["2027-11-26"]]);
    expect([dias(2026, "Fim da entrega do IRPF"), dias(2027, "Fim da entrega do IRPF")]).toEqual([["2026-05-29"], ["2027-05-31"]]);
    expect([dias(2026, "Prazo de opção pelo Simples Nacional"), dias(2027, "Prazo de opção pelo Simples Nacional")]).toEqual([["2026-01-30"], ["2027-01-29"]]);
  });

  it("antecipa o prazo que cai em fim de semana ou feriado, com aviso", () => {
    expect(achar(2026, "13º salário, 2ª parcela")).toEqual([{ dia: "2026-12-18", nome: "13º salário, 2ª parcela", tipo: "comemorativa", aviso: "Prazo legal 20/12 cai no domingo, antecipe para sexta 18/12." }]);
    expect(achar(2026, "Entrega da DASN-SIMEI")[0]).toMatchObject({ dia: "2026-05-29", aviso: "Prazo legal 31/05 cai no domingo, antecipe para sexta 29/05." });
    expect(achar(2027, "Entrega da DASN-SIMEI")).toEqual([{ dia: "2027-05-31", nome: "Entrega da DASN-SIMEI", tipo: "comemorativa" }]);
    expect(achar(2027, "13º salário, 2ª parcela")[0].aviso).toBeUndefined();
    const das = achar(2026, "DAS do Simples Nacional e do MEI");
    expect(das).toHaveLength(12);
    expect(das.find((d) => d.dia.startsWith("2026-06"))).toMatchObject({ dia: "2026-06-19", aviso: "Prazo legal 20/06 cai no sábado, antecipe para sexta 19/06." });
    expect(das.find((d) => d.dia.startsWith("2026-11"))).toMatchObject({ dia: "2026-11-19", aviso: "Prazo legal 20/11 cai no feriado (Consciência Negra), antecipe para quinta 19/11." });
  });

  it("põe destaque, feriado e comemorativa no mesmo dia nessa ordem, em ordem de data", () => {
    const natal = datasDoAno(2026).filter((d) => d.dia === "2026-12-25");
    expect(natal.map((d) => d.tipo)).toEqual(["destaque", "feriado"]);
    const todas = datasDoAno(2027).map((d) => d.dia);
    expect(todas).toEqual([...todas].sort());
    expect(todas.every((d) => d.startsWith("2027-"))).toBe(true);
  });

  it("dá as datas de um dia sem repetir o nome (Natal dourado, com o aviso de feriado)", () => {
    expect(datasDoDia("2026-12-25")).toEqual([{ dia: "2026-12-25", nome: "Natal", tipo: "destaque", aviso: "Feriado nacional." }]);
    expect(datasDoDia("2026-10-12").map((d) => `${d.tipo} ${d.nome}`)).toEqual(["destaque Dia das Crianças", "feriado Nossa Senhora Aparecida"]);
    expect(datasDoDia("2026-10-27")).toEqual([]);
  });

  it("marca os destaques e as datas duplas de marketplace", () => {
    const destaques = datasDoAno(2026).filter((d) => d.tipo === "destaque").map((d) => `${d.dia} ${d.nome}`);
    expect(destaques).toEqual([
      "2026-01-01 Ano Novo", "2026-03-15 Dia do Consumidor", "2026-05-10 Dia das Mães", "2026-05-29 Fim da entrega do IRPF",
      "2026-06-12 Dia dos Namorados", "2026-07-07 7.7 (data dupla)", "2026-08-09 Dia dos Pais", "2026-09-09 9.9 (data dupla)",
      "2026-09-15 Dia do Cliente", "2026-09-22 Dia do Contador", "2026-10-05 Dia da Micro e Pequena Empresa", "2026-10-10 10.10 (data dupla)",
      "2026-10-12 Dia das Crianças", "2026-11-11 11.11 (data dupla)", "2026-11-27 Black Friday", "2026-11-30 Cyber Monday",
      "2026-12-12 12.12 (data dupla)", "2026-12-25 Natal",
    ]);
    expect(datasDoAno(2027).filter((d) => d.nome.endsWith("(data dupla)")).map((d) => d.dia)).toEqual(
      ["02-02", "03-03", "04-04", "05-05", "06-06", "07-07", "08-08", "09-09", "10-10", "11-11", "12-12"].map((d) => `2027-${d}`),
    );
    expect(datasDoDia("2026-09-09").map((d) => d.nome)).toEqual(["9.9 (data dupla)", "Dia do Administrador"]);
  });
});
