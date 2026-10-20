// Prova de google-autorizar só com Google falso e banco falso.
import { describe, expect, it } from "vitest";
import { BASE_FALSA, criarGoogleFalso } from "../_shared/google-falso.ts";
import { criarBancoFalso, URL_FALSA } from "../drive/supabase-falso.ts";
import { criarManipulador } from "./acoes.ts";

const ENV: Record<string, string> = {
  SUPABASE_URL: URL_FALSA, SUPABASE_ANON_KEY: "chave-anon-falsa", SUPABASE_SERVICE_ROLE_KEY: "chave-servico-falsa",
  GOOGLE_API_BASE: BASE_FALSA, GOOGLE_TOKEN_BASE: BASE_FALSA, GOOGLE_AUTH_BASE: BASE_FALSA, GOOGLE_CLIENT_ID: "id-falso", GOOGLE_CLIENT_SECRET: "segredo-google-falso",
};
const env = (n: string) => ENV[n];

function montar(agora = () => Date.now()) {
  const g = criarGoogleFalso({ clientId: "id-falso", clientSecret: "segredo-google-falso" });
  const b = criarBancoFalso();
  const f = ((e: RequestInfo | URL, i?: RequestInit) => (new Request(e).url.startsWith(BASE_FALSA) ? g.fetch(e, i) : b.fetch(e, i))) as typeof fetch;
  b.estado.tabelas.pessoas.push({ id: "p-n", slug: "natham", user_id: "u-n" }, { id: "p-m", slug: "matheus", user_id: "u-m" });
  b.estado.usuarios.set("tok-n", "u-n"); b.estado.usuarios.set("tok-m", "u-m");
  let guardado: string | null = null;
  b.estado.rpcs.ler_segredo_servico = ({ p_nome }) => (p_nome === "tarefas_funcoes_segredo" ? "campainha" : p_nome === "google_drive_refresh_token" ? guardado : null);
  b.estado.rpcs.guardar_google_token = ({ p }) => { guardado = String(p); return null; };
  const tratar = criarManipulador({ env, fetch: f, agora, quemSou: async () => "nathamsud@gmail.com" });
  const pedir = (q: string, token?: string, origem = "https://app.exemplo") => tratar(new Request(`https://f/functions/v1/google-autorizar?${q}`, { headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), origin: origem } }));
  return { g, pedir, guardado: () => guardado };
}
const url = async (r: Response) => new URL(((await r.json()) as { url: string }).url);

describe("google-autorizar", () => {
  it("só o Natham pede o endereço; o endereço leva escopo drive.file, offline e consentimento", async () => {
    const m = montar();
    expect((await m.pedir("inicio=1")).status).toBe(403);
    expect((await m.pedir("inicio=1", "tok-m")).status).toBe(403);
    const u = await url(await m.pedir("inicio=1", "tok-n"));
    expect(u.searchParams.get("scope")).toBe("https://www.googleapis.com/auth/drive.file");
    expect(u.searchParams.get("access_type")).toBe("offline");
    expect(u.searchParams.get("prompt")).toBe("consent");
    expect(u.searchParams.get("redirect_uri")).toBe(`${URL_FALSA}/functions/v1/google-autorizar`);
    expect(u.toString()).not.toContain("segredo-google-falso");
  });
  it("volta do Google: guarda o refresh token e redireciona para /configuracoes?drive=ok", async () => {
    const m = montar();
    const u = await url(await m.pedir("inicio=1", "tok-n"));
    const r = await m.pedir(`code=code-falso&state=${encodeURIComponent(u.searchParams.get("state")!)}`);
    expect(r.status).toBe(302);
    expect(r.headers.get("location")).toBe("https://app.exemplo/configuracoes?drive=ok");
    expect(m.guardado()).toBe("refresh-falso");
  });
  it("state adulterado, vencido (10 min) ou code errado não guardam nada", async () => {
    let t = 1_000_000;
    const m = montar(() => t);
    const state = (await url(await m.pedir("inicio=1", "tok-n"))).searchParams.get("state")!;
    expect((await m.pedir(`code=code-falso&state=${encodeURIComponent(state.replace("natham", "matheus"))}`)).status).toBe(400);
    expect((await m.pedir(`code=code-falso&state=${encodeURIComponent(state.replace("https://app.exemplo", "https://mau.com"))}`)).status).toBe(400);
    t += 11 * 60_000;
    expect((await m.pedir(`code=code-falso&state=${encodeURIComponent(state)}`)).status).toBe(400);
    t = 1_000_000;
    const r = await m.pedir(`code=errado&state=${encodeURIComponent(state)}`);
    expect(r.headers.get("location")).toBe("https://app.exemplo/configuracoes?drive=erro");
    expect(m.guardado()).toBeNull();
  });
  it("status: desligado, depois ligado com o e-mail", async () => {
    const m = montar();
    expect(await (await m.pedir("status=1", "tok-n")).json()).toMatchObject({ ligado: false });
    const state = (await url(await m.pedir("inicio=1", "tok-n"))).searchParams.get("state")!;
    await m.pedir(`code=code-falso&state=${encodeURIComponent(state)}`);
    expect(await (await m.pedir("status=1", "tok-n")).json()).toEqual({ ligado: true, email: "nathamsud@gmail.com" });
    expect((await m.pedir("status=1", "tok-m")).status).toBe(403);
  });
});
