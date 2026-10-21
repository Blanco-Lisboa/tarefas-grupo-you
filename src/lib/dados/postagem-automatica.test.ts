import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase/cliente", () => ({ supabase: () => ({ rpc }) }));

describe("238: a tela sabe se a postagem automática está ligada", () => {
  beforeEach(() => { rpc.mockReset(); });
  it("só 'true' do banco liga; erro (019 ainda não colado), vazio ou outra coisa = desligada", async () => {
    const { lerPostagemAutomatica, recarregarPostagemAutomatica } = await import("./drive");
    expect(lerPostagemAutomatica()).toEqual({ ligada: false }); // antes de carregar
    rpc.mockResolvedValueOnce({ data: true, error: null });
    await recarregarPostagemAutomatica();
    expect(lerPostagemAutomatica().ligada).toBe(true);
    expect(rpc).toHaveBeenCalledWith("postagem_automatica_ligada");
    rpc.mockResolvedValueOnce({ data: false, error: null });
    await recarregarPostagemAutomatica();
    expect(lerPostagemAutomatica().ligada).toBe(false);
    rpc.mockResolvedValueOnce({ data: true, error: null });
    await recarregarPostagemAutomatica();
    rpc.mockResolvedValueOnce({ data: null, error: { code: "PGRST202" } }); // função não existe (019 não colado)
    await recarregarPostagemAutomatica();
    expect(lerPostagemAutomatica().ligada).toBe(false);
    rpc.mockResolvedValueOnce({ data: [], error: null });
    await recarregarPostagemAutomatica();
    expect(lerPostagemAutomatica().ligada).toBe(false);
  });
  it("o objeto só muda quando o valor muda (não re-renderiza à toa)", async () => {
    const { lerPostagemAutomatica, recarregarPostagemAutomatica } = await import("./drive");
    rpc.mockResolvedValue({ data: false, error: null });
    await recarregarPostagemAutomatica();
    const a = lerPostagemAutomatica();
    await recarregarPostagemAutomatica();
    expect(lerPostagemAutomatica()).toBe(a);
  });
});
