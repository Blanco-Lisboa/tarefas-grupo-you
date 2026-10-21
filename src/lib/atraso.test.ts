import { describe, expect, it } from "vitest";
import type { Tarefa } from "@/lib/dados";
import { diasDeAtraso } from "./atraso";

const t = (extra: Partial<Tarefa>): Tarefa => ({ id: "t", titulo: "x", tipo: "postagem", empresaId: "you", etapa: "aprovado", responsavel: "matheus", diaInteiro: false, cor: "etiqueta-1", links: [], arquivos: [], ...extra });

describe("atraso pela mesma data do Mapa (quandoDe)", () => {
  it("Postagem programada: vale a data de postar, não o início do card", () => {
    expect(diasDeAtraso(t({ inicio: "2026-10-10T09:00", postarEm: "2026-10-25T10:00" }), "2026-10-20")).toBe(0); // início velho, post no futuro
    expect(diasDeAtraso(t({ inicio: "2026-10-30T09:00", postarEm: "2026-10-18T10:00" }), "2026-10-20")).toBe(2); // post que já passou
  });
  it("sem data de postar, e em quem não é Postagem, continua o início; Postado nunca atrasa", () => {
    expect(diasDeAtraso(t({ inicio: "2026-10-17T09:00" }), "2026-10-20")).toBe(3);
    expect(diasDeAtraso(t({ tipo: "gravacao", etapa: "edicao", inicio: "2026-10-19", postarEm: "2026-10-25T10:00" }), "2026-10-20")).toBe(1);
    expect(diasDeAtraso(t({ etapa: "postado", postarEm: "2026-10-01T10:00" }), "2026-10-20")).toBe(0);
  });
});
