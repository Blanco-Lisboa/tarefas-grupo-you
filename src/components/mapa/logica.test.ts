import { describe, expect, it } from "vitest";
import type { Tarefa } from "@/lib/dados";
import { conteudos, diasDoPeriodo, foiPostado, hoje, tituloDe, postadosNoMes, ultimoDia } from "./logica";

const t = (id: string, tipo: Tarefa["tipo"], inicio?: string, extra: Partial<Tarefa> = {}): Tarefa => ({
  id, titulo: id, tipo, empresaId: "beec", responsavel: "natham", inicio, diaInteiro: false, cor: "etiqueta-1", links: [], arquivos: [], ...extra,
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
    const lista = conteudos([t("a", "postagem", "2026-10-20T12:00"), t("b", "gravacao", "2026-10-20T09:00"), t("c", "postagem")]);
    expect(lista.map((x) => x.id)).toEqual(["a"]);
  });

  it("marca postado e acha o objetivo", () => {
    expect(foiPostado(t("a", "postagem", "2026-10-20", { etapa: "postado" }))).toBe(true);
    expect(foiPostado(t("a", "postagem", "2026-10-20", { etapa: "aprovado" }))).toBe(false);
    expect(tituloDe(t("a", "postagem", undefined, { objetivo: "Vender" }))).toBe("a"); // título vence o objetivo
    expect(tituloDe(t("b", "postagem", undefined, { titulo: "  ", objetivo: " Vender " }))).toBe("Vender"); // sem título, o objetivo é a reserva
  });
});
