import { describe, expect, it } from "vitest";
import type { Tarefa } from "@/lib/dados";
import { conteudos, diasDoPeriodo, foiPostado, objetivoDe, porDia, semanas } from "./logica";

const t = (id: string, tipo: Tarefa["tipo"], inicio?: string, extra: Partial<Tarefa> = {}): Tarefa => ({
  id, titulo: id, tipo, empresaId: "beec", responsavel: "natham", inicio, diaInteiro: false, cor: "etiqueta-1", links: [], arquivos: [], ...extra,
});

describe("mapa", () => {
  it("vai de 19/10 até 31/10 e quebra em semanas de domingo a sábado", () => {
    const dias = diasDoPeriodo("2026-10-19");
    expect(dias[0]).toBe("2026-10-19");
    expect(dias.at(-1)).toBe("2026-10-31");
    expect(semanas(dias).map((s) => s.dias.length)).toEqual([6, 7]);
  });

  it("só postagem com data vira nó, e o dia ignora o horário", () => {
    const lista = conteudos([t("a", "postagem", "2026-10-20T12:00"), t("b", "gravacao", "2026-10-20T09:00"), t("c", "postagem")]);
    expect(lista.map((x) => x.id)).toEqual(["a"]);
    expect(porDia(lista, diasDoPeriodo()).get("2026-10-20")).toHaveLength(1);
    expect(porDia(lista, ["2026-10-21"]).size).toBe(0);
  });

  it("marca postado e acha o objetivo", () => {
    expect(foiPostado(t("a", "postagem", "2026-10-20", { etapa: "postado" }))).toBe(true);
    expect(foiPostado(t("a", "postagem", "2026-10-20", { etapa: "aprovado" }))).toBe(false);
    expect(objetivoDe(t("a", "postagem", undefined, { objetivo: " Vender " }))).toBe("Vender");
    expect(objetivoDe(t("b", "postagem"))).toBe("b");
  });
});
