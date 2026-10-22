import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Tarefa } from "./tipos";

const rpc = vi.fn();
const direto = vi.fn(async () => ({ data: [{ id: "x" }], error: null }));
vi.mock("@/lib/supabase/cliente", () => ({ supabase: () => ({ rpc, from: () => ({ delete: () => ({ eq: () => ({ select: direto }) }) }) }) }));
import { apagarSemAnexo } from "./apagar-card";

const card = { empresaId: "you", etapa: "edicao" } as Tarefa;
const nota = { empresaId: "", etapa: undefined } as Tarefa;
beforeEach(() => { rpc.mockReset(); direto.mockClear(); });

describe("apagarSemAnexo (287)", () => {
  it("card de conteúdo passa pela função apagar_card", async () => {
    rpc.mockResolvedValue({ error: null });
    expect((await apagarSemAnexo(card, "a")).data).toEqual([{ id: "a" }]);
    expect(rpc).toHaveBeenCalledWith("apagar_card", { p_tarefa: "a" });
    expect(direto).not.toHaveBeenCalled();
  });
  it("antes do 029 (função ausente) cai no apagar direto", async () => {
    rpc.mockResolvedValue({ error: { code: "PGRST202" } });
    await apagarSemAnexo(card, "a");
    expect(direto).toHaveBeenCalledTimes(1);
  });
  it("recusa do banco aparece como erro, sem apagar direto", async () => {
    rpc.mockResolvedValue({ error: { code: "42501" } });
    expect((await apagarSemAnexo(card, "a")).error?.code).toBe("42501");
    expect(direto).not.toHaveBeenCalled();
  });
  it("tarefa comum do Caderno apaga direto", async () => {
    await apagarSemAnexo(nota, "a");
    expect(rpc).not.toHaveBeenCalled();
    expect(direto).toHaveBeenCalledTimes(1);
  });
});
