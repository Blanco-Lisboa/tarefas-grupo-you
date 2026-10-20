// Função `google-autorizar`: o Natham liga o Google Drive uma vez. Sem Deno aqui (testável).
// Fluxo: GET ?inicio=1 (com a chave dele) -> endereço do Google; o Google volta com ?code&state; trocamos o code pelo refresh token e guardamos no Vault.
import { assinar, bases, conferir } from "../_shared/google.ts";
import { criarRest, ErroRest } from "../drive/rest.ts";

type Deps = { env: (n: string) => string | undefined; fetch: typeof fetch; agora?: () => number; quemSou?: () => Promise<string | undefined> };
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, x-client-info, apikey, content-type", "access-control-allow-methods": "GET, OPTIONS" };
const json = (s: number, c: unknown) => new Response(JSON.stringify(c), { status: s, headers: { ...CORS, "content-type": "application/json" } });
const ESCOPO = "https://www.googleapis.com/auth/drive.file";
const VALE_MS = 10 * 60_000;

export function criarManipulador(d: Deps) {
  const agora = d.agora ?? Date.now;
  const url = () => d.env("SUPABASE_URL")!;
  const chave = () => d.env("SUPABASE_SERVICE_ROLE_KEY")!;
  const redirectUri = () => `${url()}/functions/v1/google-autorizar`;
  const servico = () => criarRest(url(), chave(), chave(), d.fetch);

  async function ehNatham(token: string): Promise<boolean> {
    const r = await d.fetch(`${url()}/auth/v1/user`, { headers: { apikey: d.env("SUPABASE_ANON_KEY")!, authorization: `Bearer ${token}` } });
    if (!r.ok) return false;
    const { id } = (await r.json()) as { id: string };
    return (await servico().ler("pessoas", { user_id: id, slug: "natham" }, "id")).length > 0;
  }
  const segredo = async () => (await servico().rpc<string | null>("ler_segredo_servico", { p_nome: "tarefas_funcoes_segredo" })) ?? "";
  const volta = (origem: string, ok: boolean) => new Response(null, { status: 302, headers: { location: `${origem}/configuracoes?drive=${ok ? "ok" : "erro"}` } });

  return async function tratar(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (req.method !== "GET") return json(405, { erro: "Método não aceito." });
    const q = new URL(req.url).searchParams;
    try {
      if (q.get("inicio") || q.get("status")) {
        const token = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "")?.[1];
        if (!token || !(await ehNatham(token))) return json(403, { erro: "Só o Natham liga o Google Drive." });
        if (q.get("status")) {
          const ligado = !!(await servico().rpc<string | null>("ler_segredo_servico", { p_nome: "google_drive_refresh_token" }));
          return json(200, { ligado, email: ligado ? await d.quemSou?.().catch(() => undefined) : undefined });
        }
        const origem = req.headers.get("origin") ?? "";
        if (!/^https?:\/\/[^/]+$/.test(origem)) return json(400, { erro: "Origem inválida." });
        const base = `natham|${agora()}|${origem}`;
        const state = `${base}|${await assinar(await segredo(), base)}`;
        const ir = new URL(`${bases(d.env).auth}/o/oauth2/v2/auth`);
        ir.search = new URLSearchParams({ client_id: d.env("GOOGLE_CLIENT_ID") ?? "", redirect_uri: redirectUri(), response_type: "code", scope: ESCOPO, access_type: "offline", prompt: "consent", state }).toString();
        return json(200, { url: ir.toString() });
      }
      // volta do Google
      const state = q.get("state") ?? "", code = q.get("code");
      const partes = state.split("|");
      const sig = partes.pop() ?? "";
      const [quem, quando, origem] = partes;
      if (quem !== "natham" || !(await conferir(await segredo(), partes.join("|"), sig)) || agora() - Number(quando) > VALE_MS || !origem) return json(400, { erro: "Pedido de ligação inválido ou vencido." });
      if (!code) return volta(origem, false); // o Natham recusou no Google
      const r = await d.fetch(`${bases(d.env).token}/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: d.env("GOOGLE_CLIENT_ID") ?? "", client_secret: d.env("GOOGLE_CLIENT_SECRET") ?? "", redirect_uri: redirectUri(), grant_type: "authorization_code" }),
      });
      const j = r.ok ? ((await r.json()) as { refresh_token?: string }) : {};
      if (!j.refresh_token) return volta(origem, false);
      await servico().rpc("guardar_google_token", { p: j.refresh_token });
      return volta(origem, true);
    } catch (e) {
      console.error(JSON.stringify({ funcao: "google-autorizar", erro: e instanceof ErroRest ? e.message : "?" }));
      return json(500, { erro: "Algo deu errado. Tente de novo." });
    }
  };
}
