// Prova da função `drive`, de `_shared/google.ts` e do envio em partes, SÓ com Google falso e banco falso. Nada real.
import { describe, expect, it } from "vitest";
import { enviarEmPartes } from "../../../src/lib/dados/drive";
import { BASE_FALSA, criarGoogleFalso } from "../_shared/google-falso.ts";
import { assinar, criarGoogle } from "../_shared/google.ts";
import { criarManipulador } from "./acoes.ts";
import { criarDriveApi } from "./drive-api.ts";
import { criarBancoFalso, URL_FALSA } from "./supabase-falso.ts";

const ENV: Record<string, string> = {
  SUPABASE_URL: URL_FALSA, SUPABASE_ANON_KEY: "chave-anon-falsa", SUPABASE_SERVICE_ROLE_KEY: "chave-servico-falsa",
  GOOGLE_API_BASE: BASE_FALSA, GOOGLE_TOKEN_BASE: BASE_FALSA, GOOGLE_AUTH_BASE: BASE_FALSA, GOOGLE_CLIENT_ID: "id-falso", GOOGLE_CLIENT_SECRET: "segredo-google-falso",
  DRIVE_COMPARTILHAR_COM: "matheus@exemplo.com",
};
const SEGREDO = "segredo-campainha-falso";
const env = (n: string) => ENV[n];

function montar() {
  const g = criarGoogleFalso({ clientId: "id-falso", clientSecret: "segredo-google-falso" });
  const b = criarBancoFalso();
  const roteado = ((e: RequestInfo | URL, i?: RequestInit) => (new Request(e).url.startsWith(BASE_FALSA) ? g.fetch(e, i) : b.fetch(e, i))) as typeof fetch;
  b.estado.tabelas.pessoas.push({ id: "p-natham", slug: "natham", user_id: "u-natham" }, { id: "p-matheus", slug: "matheus", user_id: "u-matheus" });
  b.estado.tabelas.empresas.push({ id: "you", nome: "You" });
  b.estado.usuarios.set("tok-natham", "u-natham");
  b.estado.usuarios.set("tok-matheus", "u-matheus");
  b.estado.rpcs.ler_segredo_servico = ({ p_nome }) => (p_nome === "tarefas_funcoes_segredo" ? SEGREDO : p_nome === "google_drive_refresh_token" ? "refresh-falso" : null);
  b.estado.rpcs.pode_mexer_anexos = () => true;
  b.estado.rpcs.pode_apagar_tarefa = () => true;
  b.estado.rpcs.armar_alarme_servico = () => null;
  b.estado.rpcs.guardar_google_token = ({ p }) => { ENV.__token_guardado = String(p); return null; };
  b.estado.tabelas.tarefas.push({ id: "t1", titulo: "Dia das Mães", empresa_id: "you", ocasiao_id: null, etapa: "edicao" });
  const google = criarGoogle({ env, fetch: roteado });
  const api = criarDriveApi({ api: BASE_FALSA, token: google.tokenGoogle, fetch: roteado });
  const tratar = criarManipulador({ env, fetch: roteado, api, baixar: google.baixarDoDrive });
  const chamar = (corpo: object, token = "tok-natham", extra: Record<string, string> = {}) =>
    tratar(new Request("https://f/functions/v1/drive", { method: "POST", headers: { authorization: `Bearer ${token}`, origin: "https://app.exemplo", "content-type": "application/json", ...extra }, body: JSON.stringify(corpo) }));
  return { g, b, roteado, tratar, chamar, google };
}
const lerJson = async (r: Response) => (await r.json()) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function anexar(m: ReturnType<typeof montar>, bytes: Uint8Array, nome = "reels.mp4", tipo = "video", mime = "video/mp4", papel = "anexo") {
  const s = await lerJson(await m.chamar({ acao: "sessao_envio", tarefa_id: "t1", nome, tipo, mime, tamanho: bytes.length, papel }));
  const driveId = await enviarEmPartes(s.sessao_url, new Blob([bytes as BlobPart]), undefined, m.g.fetch, 4);
  return m.chamar({ acao: "confirmar_envio", tarefa_id: "t1", drive_id: driveId, nome, tipo, tamanho: bytes.length, papel, ordem: 0 });
}

describe("google.ts", () => {
  it("troca o refresh token por um token de acesso e guarda em memória", async () => {
    const m = montar();
    expect(await m.google.tokenGoogle()).toMatch(/^tok-/);
    await m.google.tokenGoogle();
    expect(m.g.estado.tokensEmitidos).toBe(1);
  });
  it("renova 5 minutos antes de vencer", async () => {
    const g = criarGoogleFalso(); const b = criarBancoFalso(); let t = 0;
    b.estado.rpcs.ler_segredo_servico = () => "refresh-falso";
    const f = ((e: RequestInfo | URL, i?: RequestInit) => (new Request(e).url.startsWith(BASE_FALSA) ? g.fetch(e, i) : b.fetch(e, i))) as typeof fetch;
    const x = criarGoogle({ env, fetch: f, agora: () => t });
    await x.tokenGoogle();
    t = 54 * 60_000; await x.tokenGoogle();
    expect(g.estado.tokensEmitidos).toBe(1);
    t = 56 * 60_000; await x.tokenGoogle();
    expect(g.estado.tokensEmitidos).toBe(2);
  });
  it("sem Google ligado, avisa claramente", async () => {
    const m = montar(); m.b.estado.rpcs.ler_segredo_servico = () => null;
    await expect(criarGoogle({ env, fetch: m.roteado }).tokenGoogle()).rejects.toThrow("não está ligado");
  });
  it("baixarDoDrive devolve o corpo em fluxo, sem ler (S2 com Google falso)", async () => {
    const m = montar();
    const a = m.g.estado.semear("grande.mp4", new Uint8Array(1000));
    const r = await m.google.baixarDoDrive(a.id);
    expect(r.bodyUsed).toBe(false);
    expect(r.body).toBeInstanceOf(ReadableStream);
    // repassa o fluxo direto a outro fetch, sem arrayBuffer() no meio
    const destino = await m.roteado(`${BASE_FALSA}/upload/sessao/x`, { method: "PUT", body: r.body, duplex: "half" } as RequestInit);
    expect(destino.status).toBe(404);
  });
});

describe("drive: envio e confirmação", () => {
  it("cria raiz, empresa e ocasião; compartilha a raiz; o navegador sobe em partes; confirma e grava a linha", async () => {
    const m = montar();
    const bytes = new Uint8Array(10).map((_, i) => i + 1);
    const r = await anexar(m, bytes);
    expect(r.status).toBe(200);
    const linha = m.b.estado.tabelas.arquivos[0];
    expect(linha).toMatchObject({ tarefa_id: "t1", tipo: "video", tamanho: 10, papel: "anexo", criado_por: "p-natham", drive_id: expect.any(String) });
    expect(linha.caminho).toBeUndefined();
    const no = m.g.estado.arquivos.get(String(linha.drive_id))!;
    expect([...no.bytes]).toEqual([...bytes]); // vai o original, byte a byte
    const nomes = [...m.g.estado.arquivos.values()].filter((a) => a.folder).map((a) => a.name);
    expect(nomes).toEqual(["Tarefas · Conteúdos", "You", "Dia das Mães"]);
    expect(m.g.estado.permissoes).toEqual([{ id: expect.any(String), email: "matheus@exemplo.com", role: "writer" }]);
    expect(m.b.estado.tabelas.tarefas[0].ocasiao_id).toBe(m.b.estado.tabelas.ocasioes[0].id); // card ganhou a ocasião
    expect([...m.g.estado.sessoes.values()][0].origem).toBe("https://app.exemplo"); // S1: Origin enviado na abertura da sessão
  });
  it("segundo anexo reaproveita as pastas (não cria de novo)", async () => {
    const m = montar();
    await anexar(m, new Uint8Array(5));
    await anexar(m, new Uint8Array(6), "foto.png", "imagem", "image/png");
    expect([...m.g.estado.arquivos.values()].filter((a) => a.folder)).toHaveLength(3);
    expect(m.b.estado.tabelas.arquivos).toHaveLength(2);
  });
  it("repetir a confirmação não duplica a linha", async () => {
    const m = montar();
    await anexar(m, new Uint8Array(5));
    const id = String(m.b.estado.tabelas.arquivos[0].drive_id);
    const r = await lerJson(await m.chamar({ acao: "confirmar_envio", tarefa_id: "t1", drive_id: id, nome: "reels.mp4", tipo: "video", tamanho: 5, papel: "anexo", ordem: 0 }));
    expect(m.b.estado.tabelas.arquivos).toHaveLength(1);
    expect(r.arquivo_id).toBe(m.b.estado.tabelas.arquivos[0].id);
  });
  it("recusa quando a trava do banco diz que não pode mexer (nada é criado no Drive)", async () => {
    const m = montar(); m.b.estado.rpcs.pode_mexer_anexos = () => false;
    const r = await m.chamar({ acao: "sessao_envio", tarefa_id: "t1", nome: "a.mp4", tipo: "video", mime: "video/mp4", tamanho: 5, papel: "anexo" }, "tok-matheus");
    expect(r.status).toBe(403);
    expect(m.g.estado.arquivos.size).toBe(0);
  });
  it("recusa card sem empresa", async () => {
    const m = montar(); m.b.estado.tabelas.tarefas[0].empresa_id = null;
    const r = await m.chamar({ acao: "sessao_envio", tarefa_id: "t1", nome: "a.mp4", tipo: "video", mime: "video/mp4", tamanho: 5, papel: "anexo" });
    expect(r.status).toBe(400);
    expect((await lerJson(r)).erro).toMatch(/empresa/i);
  });
  it("recusa capa que não é imagem, tipo falso e sem login", async () => {
    const m = montar();
    const base = { acao: "sessao_envio", tarefa_id: "t1", nome: "a", tamanho: 5 };
    expect((await m.chamar({ ...base, tipo: "video", mime: "video/mp4", papel: "capa" })).status).toBe(400);
    expect((await m.chamar({ ...base, tipo: "imagem", mime: "video/mp4", papel: "anexo" })).status).toBe(400);
    expect((await m.chamar({ ...base, tipo: "video", mime: "video/mp4" }, "tok-invalido")).status).toBe(401);
  });
  it("arquivo que não chegou inteiro ao Drive é recusado e vai para a lixeira", async () => {
    const m = montar();
    const s = await lerJson(await m.chamar({ acao: "sessao_envio", tarefa_id: "t1", nome: "a.mp4", tipo: "video", mime: "video/mp4", tamanho: 8, papel: "anexo" }));
    const id = await enviarEmPartes(s.sessao_url, new Blob([new Uint8Array(8)]), undefined, m.g.fetch, 8);
    const r = await m.chamar({ acao: "confirmar_envio", tarefa_id: "t1", drive_id: id, nome: "a.mp4", tipo: "video", tamanho: 999, papel: "anexo", ordem: 0 });
    expect(r.status).toBe(422);
    expect(m.g.estado.arquivos.get(id)!.trashed).toBe(true);
    expect(m.b.estado.tabelas.arquivos).toHaveLength(0);
  });
  it("arquivo em outra pasta do Drive não é aceito", async () => {
    const m = montar();
    await lerJson(await m.chamar({ acao: "sessao_envio", tarefa_id: "t1", nome: "a.mp4", tipo: "video", mime: "video/mp4", tamanho: 3, papel: "anexo" }));
    const intruso = m.g.estado.semear("outro.mp4", new Uint8Array(3), "video/mp4", ["pasta-de-outro"]);
    const r = await m.chamar({ acao: "confirmar_envio", tarefa_id: "t1", drive_id: intruso.id, nome: "outro.mp4", tipo: "video", tamanho: 3, papel: "anexo", ordem: 0 });
    expect(r.status).toBe(422);
  });
  it("segunda capa no mesmo card é recusada com mensagem clara", async () => {
    const m = montar();
    expect((await anexar(m, new Uint8Array(4), "c1.jpg", "imagem", "image/jpeg", "capa")).status).toBe(200);
    const r = await anexar(m, new Uint8Array(4), "c2.jpg", "imagem", "image/jpeg", "capa");
    expect(r.status).toBe(409);
  });
});

describe("enviarEmPartes (S1 sem CORS real)", () => {
  it("retoma a parte que falhou e entrega o arquivo inteiro", async () => {
    const m = montar();
    const bytes = new Uint8Array(23).map((_, i) => i);
    const s = await lerJson(await m.chamar({ acao: "sessao_envio", tarefa_id: "t1", nome: "a.mp4", tipo: "video", mime: "video/mp4", tamanho: 23, papel: "anexo" }));
    m.g.estado.falharProximasPartes = 2;
    const progresso: number[] = [];
    const id = await enviarEmPartes(s.sessao_url, new Blob([bytes]), (f) => progresso.push(f), m.g.fetch, 8);
    expect([...m.g.estado.arquivos.get(id)!.bytes]).toEqual([...bytes]);
    expect(progresso.at(-1)).toBe(1);
  });
  it("desiste depois de 3 falhas seguidas", async () => {
    const m = montar();
    const s = await lerJson(await m.chamar({ acao: "sessao_envio", tarefa_id: "t1", nome: "a.mp4", tipo: "video", mime: "video/mp4", tamanho: 8, papel: "anexo" }));
    m.g.estado.falharProximasPartes = 99;
    await expect(enviarEmPartes(s.sessao_url, new Blob([new Uint8Array(8)]), undefined, m.g.fetch, 8)).rejects.toThrow("falhou");
  });
});

describe("drive: ocasiões", () => {
  it("cria, recusa nome repetido (sem sobrar pasta) e renomeia pelo id", async () => {
    const m = montar();
    const a = await lerJson(await m.chamar({ acao: "criar_ocasiao", empresa_id: "you", nome: "Natal" }));
    expect(a.ocasiao.nome).toBe("Natal");
    const pastas = () => [...m.g.estado.arquivos.values()].filter((x) => x.folder).length;
    const antes = pastas();
    expect((await m.chamar({ acao: "criar_ocasiao", empresa_id: "you", nome: " natal " })).status).toBe(409);
    expect(pastas()).toBe(antes);
    await m.chamar({ acao: "renomear_ocasiao", ocasiao_id: a.ocasiao.id, nome: "Natal 2026" });
    const pasta = m.g.estado.arquivos.get(String(m.b.estado.tabelas.ocasioes[0].drive_pasta_id))!;
    expect(pasta.name).toBe("Natal 2026");
    expect(m.b.estado.tabelas.ocasioes[0].nome).toBe("Natal 2026");
  });
  it("renomear para nome que outra ocasião já tem é recusado", async () => {
    const m = montar();
    await m.chamar({ acao: "criar_ocasiao", empresa_id: "you", nome: "A" });
    const b = await lerJson(await m.chamar({ acao: "criar_ocasiao", empresa_id: "you", nome: "B" }));
    expect((await m.chamar({ acao: "renomear_ocasiao", ocasiao_id: b.ocasiao.id, nome: "a" })).status).toBe(409);
  });
});

describe("drive: apagar", () => {
  it("apagar_anexo: lixeira do Google e some a linha", async () => {
    const m = montar(); await anexar(m, new Uint8Array(5));
    const l = m.b.estado.tabelas.arquivos[0];
    expect((await m.chamar({ acao: "apagar_anexo", arquivo_id: l.id })).status).toBe(200);
    expect(m.g.estado.arquivos.get(String(l.drive_id))!.trashed).toBe(true);
    expect(m.b.estado.tabelas.arquivos).toHaveLength(0);
  });
  it("apagar_anexo respeita a trava (depois de Aprovado, só quem aprova)", async () => {
    const m = montar(); await anexar(m, new Uint8Array(5));
    m.b.estado.rpcs.pode_mexer_anexos = () => false;
    expect((await m.chamar({ acao: "apagar_anexo", arquivo_id: m.b.estado.tabelas.arquivos[0].id }, "tok-matheus")).status).toBe(403);
    expect(m.b.estado.tabelas.arquivos).toHaveLength(1);
  });
  it("apagar_tarefa: arquivos (Drive e Supabase) e linhas saem ANTES do card; o card sai com a chave do usuário", async () => {
    const m = montar(); await anexar(m, new Uint8Array(5));
    m.b.estado.tabelas.arquivos.push({ id: "a-sup", tarefa_id: "t1", caminho: "tarefas/t1/foto.png", drive_id: null, tipo: "imagem" });
    const r = await m.chamar({ acao: "apagar_tarefa", tarefa_id: "t1" });
    expect(r.status).toBe(200);
    expect([...m.g.estado.arquivos.values()].filter((a) => !a.folder).every((a) => a.trashed)).toBe(true);
    expect(m.b.estado.objetosRemovidos).toEqual(["tarefas/t1/foto.png"]);
    expect(m.b.estado.tabelas.arquivos).toHaveLength(0);
    expect(m.b.estado.tabelas.tarefas).toHaveLength(0);
  });
  it("apagar_tarefa: se o Drive falha, nada some pela metade", async () => {
    const m = montar(); await anexar(m, new Uint8Array(5));
    const erroDrive = ((e: RequestInfo | URL, i?: RequestInit) => (i?.method === "PATCH" ? Promise.resolve(new Response("{}", { status: 500 })) : m.roteado(e, i))) as typeof fetch;
    const g2 = criarGoogle({ env, fetch: erroDrive });
    const t = criarManipulador({ env, fetch: erroDrive, api: criarDriveApi({ api: BASE_FALSA, token: g2.tokenGoogle, fetch: erroDrive }), baixar: g2.baixarDoDrive });
    const r = await t(new Request("https://f", { method: "POST", headers: { authorization: "Bearer tok-natham" }, body: JSON.stringify({ acao: "apagar_tarefa", tarefa_id: "t1" }) }));
    expect(r.status).toBe(502);
    expect((await lerJson(r)).erro).toBe("Não consegui apagar no Drive, tente de novo.");
    expect(m.b.estado.tabelas.tarefas).toHaveLength(1);
    expect(m.b.estado.tabelas.arquivos).toHaveLength(1);
  });
  it("apagar_tarefa: sem permissão não toca em nada", async () => {
    const m = montar(); await anexar(m, new Uint8Array(5));
    m.b.estado.rpcs.pode_apagar_tarefa = () => false;
    expect((await m.chamar({ acao: "apagar_tarefa", tarefa_id: "t1" }, "tok-matheus")).status).toBe(403);
    expect([...m.g.estado.arquivos.values()].some((a) => a.trashed)).toBe(false);
  });
  it("o banco recusando o delete final do card devolve 403 (a trava do 019 vale)", async () => {
    const m = montar(); m.b.estado.podeApagarTarefa = () => false;
    expect((await m.chamar({ acao: "apagar_tarefa", tarefa_id: "t1" })).status).toBe(403);
    expect(m.b.estado.tabelas.tarefas).toHaveLength(1);
  });
});

describe("drive: limpar (alarme de 7 dias)", () => {
  const limpar = (m: ReturnType<typeof montar>, segredo = SEGREDO) =>
    m.tratar(new Request("https://f", { method: "POST", headers: { "x-tarefas-segredo": segredo }, body: JSON.stringify({ acao: "limpar", tarefa_id: "t1" }) }));
  it("só com o segredo; card Postado perde os arquivos e mantém o card", async () => {
    const m = montar(); await anexar(m, new Uint8Array(5));
    m.b.estado.tabelas.tarefas[0].etapa = "postado";
    expect((await limpar(m, "errado")).status).toBe(401);
    expect(m.b.estado.tabelas.arquivos).toHaveLength(1);
    expect((await limpar(m)).status).toBe(200);
    expect(m.b.estado.tabelas.arquivos).toHaveLength(0);
    expect(m.b.estado.tabelas.tarefas).toHaveLength(1);
    expect([...m.g.estado.arquivos.values()].find((a) => !a.folder)!.trashed).toBe(true);
  });
  it("card que não está em Postado não é limpo", async () => {
    const m = montar(); await anexar(m, new Uint8Array(5));
    expect((await limpar(m)).status).toBe(409);
    expect(m.b.estado.tabelas.arquivos).toHaveLength(1);
  });
  it("o segredo não abre as outras ações", async () => {
    const m = montar();
    const r = await m.tratar(new Request("https://f", { method: "POST", headers: { "x-tarefas-segredo": SEGREDO }, body: JSON.stringify({ acao: "apagar_tarefa", tarefa_id: "t1" }) }));
    expect(r.status).toBe(401);
  });
  it("falha no Drive: rearma o alarme para daqui a 60 min", async () => {
    const m = montar(); await anexar(m, new Uint8Array(5));
    m.b.estado.tabelas.tarefas[0].etapa = "postado";
    const erroDrive = ((e: RequestInfo | URL, i?: RequestInit) => (i?.method === "PATCH" ? Promise.resolve(new Response("{}", { status: 500 })) : m.roteado(e, i))) as typeof fetch;
    const g2 = criarGoogle({ env, fetch: erroDrive });
    const t = criarManipulador({ env, fetch: erroDrive, api: criarDriveApi({ api: BASE_FALSA, token: g2.tokenGoogle, fetch: erroDrive }), baixar: g2.baixarDoDrive });
    const r = await t(new Request("https://f", { method: "POST", headers: { "x-tarefas-segredo": SEGREDO }, body: JSON.stringify({ acao: "limpar", tarefa_id: "t1" }) }));
    expect(r.status).toBe(502);
    expect(m.b.estado.chamadasRpc.at(-1)).toMatchObject({ nome: "armar_alarme_servico", args: { p_tipo: "limpar", p_minutos: 60 } });
  });
});

describe("drive: vídeo por pedaços (S5 com Google falso)", () => {
  it("link_video assina por 10 min e o GET serve com Range, sem baixar o arquivo inteiro", async () => {
    const m = montar();
    const bytes = new Uint8Array(1000).map((_, i) => i % 256);
    await anexar(m, bytes);
    const id = String(m.b.estado.tabelas.arquivos[0].id);
    const { url } = await lerJson(await m.chamar({ acao: "link_video", arquivo_id: id }));
    expect(url).toMatch(/\?ver=.+&ate=\d+&sig=[0-9a-f]{64}$/);
    const r = await m.tratar(new Request(url, { headers: { range: "bytes=100-199" } }));
    expect(r.status).toBe(206);
    expect(r.headers.get("content-range")).toBe("bytes 100-199/1000");
    expect(r.headers.get("accept-ranges")).toBe("bytes");
    expect([...new Uint8Array(await r.arrayBuffer())]).toEqual([...bytes.slice(100, 200)]);
    expect(m.g.estado.chamadas.filter((c) => c.range).map((c) => c.range)).toEqual(["bytes=100-199"]);
    const fim = await m.tratar(new Request(url, { headers: { range: "bytes=900-" } }));
    expect(fim.status).toBe(206);
    expect((await fim.arrayBuffer()).byteLength).toBe(100);
    expect((await m.tratar(new Request(url, { headers: { range: "bytes=5000-" } }))).status).toBe(416);
  });
  it("link adulterado, vencido ou de outro arquivo é recusado", async () => {
    const m = montar(); await anexar(m, new Uint8Array(10));
    const id = String(m.b.estado.tabelas.arquivos[0].id);
    const { url } = await lerJson(await m.chamar({ acao: "link_video", arquivo_id: id }));
    expect((await m.tratar(new Request(url.replace(/sig=./, "sig=0")))).status).toBe(403);
    expect((await m.tratar(new Request(url.replace(/ver=[^&]+/, "ver=outro")))).status).toBe(403);
    const vencido = Date.now() - 1000;
    const sig = await assinar(SEGREDO, `${id}.${vencido}`);
    expect((await m.tratar(new Request(`${URL_FALSA}/functions/v1/drive?ver=${id}&ate=${vencido}&sig=${sig}`))).status).toBe(403);
  });
  it("quem não vê o card não ganha link (a trava de leitura do banco decide)", async () => {
    const m = montar(); await anexar(m, new Uint8Array(10));
    m.b.estado.le = (t) => t !== "arquivos";
    expect((await m.chamar({ acao: "link_video", arquivo_id: String(m.b.estado.tabelas.arquivos[0].id) }, "tok-matheus")).status).toBe(404);
  });
  it("não vaza chave nem token nos corpos de erro", async () => {
    const m = montar();
    const r = await m.chamar({ acao: "sessao_envio", tarefa_id: "nao-existe", nome: "a.mp4", tipo: "video", mime: "video/mp4", tamanho: 5, papel: "anexo" });
    const txt = await r.text();
    for (const s of ["chave-servico-falsa", "segredo-google-falso", SEGREDO, "refresh-falso"]) expect(txt).not.toContain(s);
  });
});

describe("drive: ordem do carrossel", () => {
  it("grava a ordem só em arquivos do próprio card e respeita a trava", async () => {
    const m = montar(); await anexar(m, new Uint8Array(5)); await anexar(m, new Uint8Array(5), "b.png", "imagem", "image/png");
    m.b.estado.tabelas.arquivos.push({ id: "alheio", tarefa_id: "outro", drive_id: "x", ordem: 7 });
    const [a, b] = m.b.estado.tabelas.arquivos;
    const r = await m.chamar({ acao: "ordenar_anexos", tarefa_id: "t1", ordem: [{ id: a.id, ordem: 1 }, { id: b.id, ordem: 0 }, { id: "alheio", ordem: 0 }] });
    expect(r.status).toBe(200);
    expect([a.ordem, b.ordem, m.b.estado.tabelas.arquivos[2].ordem]).toEqual([1, 0, 7]);
    m.b.estado.rpcs.pode_mexer_anexos = () => false;
    expect((await m.chamar({ acao: "ordenar_anexos", tarefa_id: "t1", ordem: [{ id: a.id, ordem: 5 }] }, "tok-matheus")).status).toBe(403);
  });
});
