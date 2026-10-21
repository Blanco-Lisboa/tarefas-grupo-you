import { beforeEach, describe, expect, it, vi } from "vitest";

// 243 · excluirTag só tira a tag depois que o banco confirma; recarregarTags devolve o que existe no banco.
let lidas: { id: string; nome: string; cor: string; aprovacao: boolean }[] = [];
let apagar: () => Promise<{ error: unknown }> = async () => ({ error: null });
const tabela = { select: () => ({ order: async () => ({ data: lidas, error: null }) }), delete: () => ({ eq: () => apagar() }) };
let contar: () => Promise<{ data: unknown; error: unknown }> = async () => ({ data: 0, error: null });
const rpc = vi.fn((nome: string, args: unknown) => (void nome, void args, contar()));
vi.mock("@/lib/supabase/cliente", () => ({ supabase: () => ({ from: () => tabela, rpc }) }));

const { contarCardsDaTag, excluirTag, lerErro, lerTags, limparErro, recarregarTags } = await import("./repositorio");
const tag = (id: string, aprovacao = false) => ({ id, nome: id, cor: "etiqueta-1", aprovacao });
beforeEach(async () => { lidas = [tag("a"), tag("b"), tag("sistema", true)]; await recarregarTags(); limparErro(); });

describe("tags (243)", () => {
  it("contarCardsDaTag: o número do banco; função ausente (antes do 022) ou resposta estranha = null", async () => {
    contar = async () => ({ data: 7, error: null });
    expect(await contarCardsDaTag("a")).toBe(7);
    expect(rpc).toHaveBeenLastCalledWith("contar_cards_da_tag", { p_tag: "a" });
    contar = async () => ({ data: null, error: { code: "PGRST202" } });
    expect(await contarCardsDaTag("a")).toBeNull();
    contar = async () => ({ data: "7", error: null });
    expect(await contarCardsDaTag("a")).toBeNull();
  });
  it("recarregarTags devolve os ids do banco (tag excluída por outra pessoa some)", async () => {
    lidas = [tag("a")];
    expect(await recarregarTags()).toEqual(["a"]);
  });
  it("excluirTag: enquanto o banco não responde a tag continua; confirmou, sai", async () => {
    let soltar!: (r: { error: unknown }) => void;
    apagar = () => new Promise((r) => { soltar = r; });
    const indo = excluirTag("a");
    expect(lerTags().map((t) => t.id)).toContain("a");
    soltar({ error: null });
    expect(await indo).toBe(true);
    expect(lerTags().map((t) => t.id)).not.toContain("a");
  });
  it("excluirTag: o banco recusou, a tag fica e aparece o aviso; a tag do sistema nem tenta", async () => {
    apagar = async () => ({ error: { message: "rede" } });
    expect(await excluirTag("b")).toBe(false);
    expect(lerTags().map((t) => t.id)).toContain("b");
    expect(lerErro()).toBe("Não consegui excluir a tag. Tente de novo.");
    expect(await excluirTag("sistema")).toBe(false);
  });
});
