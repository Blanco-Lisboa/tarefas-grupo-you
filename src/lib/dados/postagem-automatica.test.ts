import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase/cliente", () => ({ supabase: () => ({ rpc, auth: { getSession: async () => ({ data: { session: { access_token: "tok" } } }) } }) }));
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://banco.falso";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "anon";

const resposta = (corpo: unknown, ok = true) => ({ ok, json: async () => corpo }) as Response;
let modo = vi.fn();
beforeEach(() => { rpc.mockReset(); modo = vi.fn(async () => resposta({ deVerdade: true })); vi.stubGlobal("fetch", modo); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("238: a tela sabe se a postagem automática está ligada", () => {
  it("só 'true' do banco liga; erro (019 ainda não colado), vazio ou outra coisa = desligada", async () => {
    const { lerPostagemAutomatica, recarregarPostagemAutomatica } = await import("./drive");
    expect(lerPostagemAutomatica()).toEqual({ ligada: false, deVerdade: false }); // antes de carregar
    rpc.mockResolvedValueOnce({ data: true, error: null });
    await recarregarPostagemAutomatica();
    expect(lerPostagemAutomatica().ligada).toBe(true);
    expect(rpc).toHaveBeenCalledWith("postagem_automatica_ligada");
    rpc.mockResolvedValueOnce({ data: false, error: null });
    await recarregarPostagemAutomatica();
    expect(lerPostagemAutomatica()).toEqual({ ligada: false, deVerdade: false });
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

describe("239: modo de teste (a função confirma que publica de verdade) e releitura", () => {
  it("ligada + a função diz deVerdade → { ligada, deVerdade } true; pergunta com o login, ação 'modo'", async () => {
    const { lerPostagemAutomatica, recarregarPostagemAutomatica } = await import("./drive");
    rpc.mockResolvedValue({ data: true, error: null });
    await recarregarPostagemAutomatica();
    expect(lerPostagemAutomatica()).toEqual({ ligada: true, deVerdade: true });
    const [url, init] = modo.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://banco.falso/functions/v1/postar-meta");
    expect(JSON.parse(String(init.body))).toEqual({ acao: "modo" });
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer tok");
  });
  it("ligada, mas a função diz que é teste, está fora do ar, recusou ou deu erro → deVerdade FALSE (conservador: nunca promete post)", async () => {
    const { lerPostagemAutomatica, recarregarPostagemAutomatica } = await import("./drive");
    rpc.mockResolvedValue({ data: true, error: null });
    for (const r of [() => resposta({ deVerdade: false }), () => resposta({}, false), () => resposta({ deVerdade: "sim" }), () => { throw new TypeError("rede caiu"); }]) {
      modo.mockImplementation(async () => r());
      await recarregarPostagemAutomatica();
      expect(lerPostagemAutomatica()).toEqual({ ligada: true, deVerdade: false });
      rpc.mockResolvedValueOnce({ data: false, error: null });
      await recarregarPostagemAutomatica(); // volta ao zero entre os casos
    }
  });
  it("desligada: nem pergunta à função", async () => {
    const { recarregarPostagemAutomatica } = await import("./drive");
    rpc.mockResolvedValue({ data: false, error: null });
    await recarregarPostagemAutomatica();
    expect(modo).not.toHaveBeenCalled();
  });
  it("4: relê quando a aba volta a ficar visível, e só então (290: sem relógio); quem chamou pode desligar", async () => {
    vi.useFakeTimers();
    const { acompanharPostagemAutomatica } = await import("./drive");
    rpc.mockResolvedValue({ data: false, error: null });
    const ouvintes: Record<string, () => void> = {};
    const doc = { hidden: true, addEventListener: (n: string, f: () => void) => { ouvintes[n] = f; }, removeEventListener: (n: string) => { delete ouvintes[n]; } };
    const parar = acompanharPostagemAutomatica(doc as never);
    doc.hidden = false;
    ouvintes.visibilitychange(); // voltou para a aba
    await vi.advanceTimersByTimeAsync(0);
    expect(rpc).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60 * 60_000); // 1 hora com a aba aberta
    expect(rpc).toHaveBeenCalledTimes(1); // não pergunta sozinho
    ouvintes.visibilitychange();
    await vi.advanceTimersByTimeAsync(0);
    expect(rpc).toHaveBeenCalledTimes(2);
    parar();
    expect(ouvintes.visibilitychange).toBeUndefined();
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(rpc).toHaveBeenCalledTimes(2); // desligado: não relê mais
  });
});
