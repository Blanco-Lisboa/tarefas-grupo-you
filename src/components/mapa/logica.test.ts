import { describe, expect, it } from "vitest";
import type { Tarefa } from "@/lib/dados";
import { ETAPAS_ATE_POSTAR, PASSO, conteudos, diasDoPeriodo, filaPorDia, foiPostado, hoje, prazo, tituloDe, postadosNoMes, ultimoDia } from "./logica";

const t = (id: string, tipo: Tarefa["tipo"], inicio?: string, extra: Partial<Tarefa> = {}): Tarefa => ({
  id, titulo: id, tipo, empresaId: "beec", etapa: "roteiro", responsavel: "natham", inicio, diaInteiro: false, cor: "etiqueta-1", links: [], arquivos: [], ...extra,
});

describe("mapa", () => {
  it("vai de 19/10 até 31/10", () => {
    const dias = diasDoPeriodo("2026-10-19");
    expect(dias[0]).toBe("2026-10-19");
    expect(dias.at(-1)).toBe("2026-10-31");
  });

  it("estica o período até a última postagem se ela passar do fim do mês", () => {
    expect(diasDoPeriodo("2026-10-19", "2026-11-02").at(-1)).toBe("2026-11-02");
    expect(diasDoPeriodo("2026-10-19", "2026-10-25").at(-1)).toBe("2026-10-31");
    expect(ultimoDia([t("a", "postagem", "2026-11-09T12:00"), t("b", "postagem", "2026-10-20T09:00")])).toBe("2026-11-09");
  });

  it("o início é hoje em data local e o 'já postados' conta o mês de hoje", () => {
    expect(hoje(new Date(2026, 10, 3, 23, 30))).toBe("2026-11-03"); // 23h30 local: toISOString daria 04/11 no Brasil
    const lista = [t("a", "postagem", "2026-10-30T09:00", { etapa: "postado" }), t("b", "postagem", "2026-11-02T09:00", { etapa: "postado" })];
    expect(postadosNoMes(lista, hoje(new Date(2026, 10, 3)))).toBe(1);
  });

  it("só postagem com data vira nó, e o dia ignora o horário", () => {
    const lista = conteudos([t("a", "postagem", "2026-10-20T12:00"), t("b", "gravacao", "2026-10-20T09:00"), t("c", "postagem"), t("pessoal", "postagem", "2026-10-20T09:00", { empresaId: "" }), t("sem-etapa", "postagem", "2026-10-20T09:00", { etapa: undefined })]);
    expect(lista.map((x) => x.id)).toEqual(["a"]);
  });

  it("marca postado e acha o objetivo", () => {
    expect(foiPostado(t("a", "postagem", "2026-10-20", { etapa: "postado" }))).toBe(true);
    expect(foiPostado(t("a", "postagem", "2026-10-20", { etapa: "aprovado" }))).toBe(false);
    expect(tituloDe(t("a", "postagem", undefined, { objetivo: "Vender" }))).toBe("a"); // título vence o objetivo
    expect(tituloDe(t("b", "postagem", undefined, { titulo: "  ", objetivo: " Vender " }))).toBe("Vender"); // sem título, o objetivo é a reserva
  });
});

describe("fila por dia", () => {
  const lista = [
    t("c-sem-hora", "postagem", "2026-10-21", { etapa: "aprovado" }),
    t("b-tarde", "postagem", "2026-10-21T15:00", { etapa: "edicao" }),
    t("a-sem-hora", "postagem", "2026-10-21", { etapa: "roteiro" }),
    t("cedo", "postagem", "2026-10-21T08:00", { etapa: "aprovado" }),
    t("velho2", "postagem", "2026-10-18", { etapa: "gravacao" }),
    t("velho1", "postagem", "2026-10-17", { etapa: "gravacao" }),
    t("feito", "postagem", "2026-10-19", { etapa: "postado" }),
    t("roteiro-velho", "roteiro", "2026-10-07T10:00", { etapa: "roteiro" }), // não é postagem, mas é conteúdo atrasado
    t("reuniao-velha", "reuniao", "2026-10-07T10:00", { etapa: undefined }), // sem etapa: não é conteúdo
    t("longe", "postagem", "2026-11-30", { etapa: "aprovado" }),
  ];
  const f = filaPorDia(lista, "2026-10-19");

  it("um card por dia, hoje primeiro com o atrasado no topo e o postado de fora", () => {
    expect(f.map((g) => [g.dia, g.dias])).toEqual([["2026-10-19", 0], ["2026-10-21", 2], ["2026-11-30", 42]]);
    expect(f[0].itens.map((i) => i.t.id)).toEqual(["roteiro-velho", "velho1", "velho2"]);
    expect(f[0].itens.map((i) => i.dias)).toEqual([-12, -2, -1]);
  });

  it("no dia: sem horário na ordem de criação (no topo, como na folha), com horário na linha do horário", () => {
    expect(f[1].itens.map((i) => i.t.id)).toEqual(["c-sem-hora", "a-sem-hora", "cedo", "b-tarde"]);
    expect(f[1].itens.map((i) => i.passo)).toEqual(["Postar", "Gravar", "Postar", "Enviar para análise"]);
  });

  it("o próximo passo segue a ordem das etapas", () => {
    expect(ETAPAS_ATE_POSTAR.map((e) => PASSO[e])).toEqual(["Gravar", "Editar", "Enviar para análise", "Aprovar", "Postar"]);
  });

  it("hoje aparece mesmo sem nada hoje, e sem nada a fazer não há card", () => {
    expect(filaPorDia([t("x", "postagem", "2026-10-25")], "2026-10-19")[0]).toMatchObject({ dia: "2026-10-19", itens: [] });
    expect(filaPorDia([t("y", "postagem", "2026-10-25", { etapa: "postado" })], "2026-10-19")).toEqual([]);
  });

  it("textos de prazo", () => {
    expect([prazo(-2), prazo(0), prazo(1), prazo(9)]).toEqual(["Atrasado 2 dias", "Hoje", "Amanhã", "Em 9 dias"]);
  });

  it("não coloca tarefa pessoal na fila, mesmo se for postagem atrasada", () => {
    const pessoal = t("pessoal", "postagem", "2026-10-18", { etapa: "roteiro", empresaId: "" });
    expect(filaPorDia([pessoal], "2026-10-19")).toEqual([]);
  });
});
