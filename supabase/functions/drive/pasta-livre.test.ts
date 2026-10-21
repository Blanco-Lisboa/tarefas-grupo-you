// Item 234: PASTA LIVRE (a "+ Nova pasta"). SÓ Google falso e banco falso. As regras de quem pode (cadeado, quem desliga, não apagar com cadeado)
// são do BANCO (019 v2): o banco falso as repete para provar que a função pergunta a ele e obedece à recusa.
import { describe, expect, it } from "vitest";
import { enviarEmPartes } from "../../../src/lib/dados/drive";
import { BASE_FALSA, criarGoogleFalso } from "../_shared/google-falso.ts";
import { criarGoogle } from "../_shared/google.ts";
import { nomeReservado } from "../_shared/pastas.ts";
import { criarManipulador } from "./acoes.ts";
import { criarDriveApi } from "./drive-api.ts";
import { criarBancoFalso, URL_FALSA } from "./supabase-falso.ts";

const ENV: Record<string, string> = {
  SUPABASE_URL: URL_FALSA, SUPABASE_ANON_KEY: "chave-anon-falsa", SUPABASE_SERVICE_ROLE_KEY: "chave-servico-falsa",
  GOOGLE_API_BASE: BASE_FALSA, GOOGLE_TOKEN_BASE: BASE_FALSA, GOOGLE_AUTH_BASE: BASE_FALSA, GOOGLE_CLIENT_ID: "id-falso", GOOGLE_CLIENT_SECRET: "segredo-google-falso",
};
const SEGREDO = "segredo-campainha-falso";
const env = (n: string) => ENV[n];
type L = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const lerJson = async (r: Response) => (await r.json()) as L;

function montar() {
  const g = criarGoogleFalso({ clientId: "id-falso", clientSecret: "segredo-google-falso" });
  const b = criarBancoFalso();
  const roteado = ((e: RequestInfo | URL, i?: RequestInit) => (new Request(e).url.startsWith(BASE_FALSA) ? g.fetch(e, i) : b.fetch(e, i))) as typeof fetch;
  const t = b.estado.tabelas;
  t.pessoas.push({ id: "p-natham", slug: "natham", user_id: "u-natham" }, { id: "p-matheus", slug: "matheus", user_id: "u-matheus" }, { id: "p-adrian", slug: "adrian", user_id: "u-adrian" });
  t.empresas.push({ id: "you", nome: "You" }, { id: "beec", nome: "Beec" });
  b.estado.usuarios.set("tok-natham", "u-natham");
  b.estado.usuarios.set("tok-matheus", "u-matheus");
  b.estado.usuarios.set("tok-adrian", "u-adrian"); // tem login, mas NÃO é Natham nem Matheus
  const alarmes: string[] = [];
  b.estado.rpcs.ler_segredo_servico = ({ p_nome }) => (p_nome === "tarefas_funcoes_segredo" ? SEGREDO : p_nome === "google_drive_refresh_token" ? "refresh-falso" : null);
  // 019 v2: só Natham e Matheus mexem nas pastas e LIGAM o Permanente (public.pode_mexer_pastas / pode_ligar_permanente)
  const natMat = (_a: unknown, token: string) => token === "tok-natham" || token === "tok-matheus";
  b.estado.rpcs.pode_mexer_pastas = natMat;
  b.estado.rpcs.pode_ligar_permanente = natMat;
  b.estado.rpcs.armar_alarme_servico = (a) => void alarmes.push(`armar ${a.p_tarefa}`);
  b.estado.rpcs.desarmar_alarme_servico = (a) => void alarmes.push(`desarmar ${a.p_tarefa}`);
  // Regras do 019 v2 (private.definir_permanente_livre e private.pode_apagar_pasta_livre)
  b.estado.rpcs.definir_permanente_livre = (a, token) => {
    const slug = token === "tok-natham" ? "natham" : token === "tok-matheus" ? "matheus" : undefined;
    const p = t.pastas_livres.find((x) => x.id === a.p_pasta);
    if (!slug || !p) throw { status: 403, codigo: "42501" };
    if (p.permanente && !a.p_ligado && slug !== "natham") throw { status: 403, codigo: "42501" };
    p.permanente = a.p_ligado;
    return null;
  };
  b.estado.rpcs.pode_apagar_pasta_livre = (a, token) => b.estado.usuarios.has(token) && t.pastas_livres.some((x) => x.id === a.p_pasta && !x.permanente);
  const google = criarGoogle({ env, fetch: roteado });
  const api = criarDriveApi({ api: BASE_FALSA, token: google.tokenGoogle, fetch: roteado });
  const tratar = criarManipulador({ env, fetch: roteado, api, baixar: google.baixarDoDrive });
  const chamar = (corpo: object, token = "tok-natham") =>
    tratar(new Request("https://f/functions/v1/drive", { method: "POST", headers: { authorization: `Bearer ${token}`, origin: "https://app.exemplo", "content-type": "application/json" }, body: JSON.stringify(corpo) }));
  const campainha = (corpo: object) =>
    tratar(new Request("https://f/functions/v1/drive", { method: "POST", headers: { "x-tarefas-segredo": SEGREDO, "content-type": "application/json" }, body: JSON.stringify(corpo) }));
  const arvore = () => {
    const nome = (id: string): string => { const a = g.estado.arquivos.get(id); return a ? (a.parents[0] && g.estado.arquivos.get(a.parents[0]) ? `${nome(a.parents[0])}/${a.name}` : a.name) : "?"; };
    return [...g.estado.arquivos.values()].filter((a) => a.folder && !a.trashed).map((p) => nome(p.id)).sort();
  };
  return { g, b, t, chamar, campainha, alarmes, arvore };
}
type M = ReturnType<typeof montar>;
const criar = async (m: M, nome: string, extra: object = {}, token = "tok-natham", empresa = "you") => lerJson(await m.chamar({ acao: "criar_pasta_livre", empresa_id: empresa, nome, ...extra }, token));
const subir = async (m: M, pasta: string, bytes = new Uint8Array(5), nome = "logo.png", token = "tok-matheus") => {
  const s = await lerJson(await m.chamar({ acao: "sessao_envio_livre", pasta_id: pasta, nome, tipo: "imagem", mime: "image/png", tamanho: bytes.length }, token));
  if (!s.sessao_url) return { s };
  const driveId = await enviarEmPartes(s.sessao_url, new Blob([bytes as BlobPart]), undefined, m.g.fetch, 4);
  const r = await m.chamar({ acao: "confirmar_envio_livre", pasta_id: pasta, drive_id: driveId, nome, tipo: "imagem", tamanho: bytes.length }, token);
  return { s, r, driveId };
};

describe("234: criar a pasta livre", () => {
  it("nasce na empresa, AO LADO das pastas de formato, sem cadeado (padrão), já no Drive", async () => {
    const m = montar();
    const r = await criar(m, "Logos e marca");
    expect(r.pasta).toMatchObject({ empresa_id: "you", nome: "Logos e marca", permanente: false });
    expect(m.t.pastas_livres[0]).toMatchObject({ criado_por: "p-natham" });
    expect(m.arvore()).toEqual(["Tarefas · Conteúdos", "Tarefas · Conteúdos/You", "Tarefas · Conteúdos/You/Logos e marca"]);
    expect(m.t.drive_pastas.some((x) => x.chave === `livre:${r.pasta.id}`)).toBe(true);
  });
  it("Natham e Matheus criam, já com cadeado se quiserem", async () => {
    const m = montar();
    expect((await criar(m, "A", { permanente: true }, "tok-matheus")).pasta.permanente).toBe(true);
    expect((await criar(m, "B")).pasta.permanente).toBe(false);
  });
  it("recusa nome repetido na mesma empresa (outra empresa pode), nome de formato, vazio, sem login e empresa que não existe", async () => {
    const m = montar();
    await criar(m, "Referências");
    const antes = m.arvore().length;
    expect((await m.chamar({ acao: "criar_pasta_livre", empresa_id: "you", nome: " referências " })).status).toBe(409);
    expect((await m.chamar({ acao: "criar_pasta_livre", empresa_id: "you", nome: "reels" })).status).toBe(409);
    expect((await m.chamar({ acao: "criar_pasta_livre", empresa_id: "you", nome: "Sem formato" })).status).toBe(409);
    expect((await m.chamar({ acao: "criar_pasta_livre", empresa_id: "you", nome: "   " })).status).toBe(400);
    expect((await m.chamar({ acao: "criar_pasta_livre", empresa_id: "you", nome: "X" }, "tok-ninguem")).status).toBe(401);
    expect((await m.chamar({ acao: "criar_pasta_livre", empresa_id: "nao-existe", nome: "X" })).status).toBe(403);
    expect(m.arvore()).toHaveLength(antes); // nada ficou pelo Drive
    expect((await criar(m, "Referências", {}, "tok-natham", "beec")).pasta.empresa_id).toBe("beec");
    expect(nomeReservado("Stories")).toBe(true);
  });
  it("renomear funciona COM cadeado e muda o nome no Drive pelo id", async () => {
    const m = montar();
    const { pasta } = await criar(m, "Logos", { permanente: true });
    expect((await m.chamar({ acao: "renomear_pasta_livre", pasta_id: pasta.id, nome: "Logos e marca" }, "tok-matheus")).status).toBe(200);
    expect(m.t.pastas_livres[0].nome).toBe("Logos e marca");
    expect(m.arvore()).toContain("Tarefas · Conteúdos/You/Logos e marca");
    await criar(m, "Outra");
    expect((await m.chamar({ acao: "renomear_pasta_livre", pasta_id: pasta.id, nome: "outra" })).status).toBe(409);
  });
});

describe("234: o cadeado (Permanente) da pasta livre", () => {
  it("o Matheus LIGA; quando tenta desligar o BANCO recusa; o Natham desliga", async () => {
    const m = montar();
    const { pasta } = await criar(m, "Logos");
    expect((await m.chamar({ acao: "permanente_pasta_livre", pasta_id: pasta.id, ligado: true }, "tok-matheus")).status).toBe(200);
    expect(m.t.pastas_livres[0].permanente).toBe(true);
    const nao = await m.chamar({ acao: "permanente_pasta_livre", pasta_id: pasta.id, ligado: false }, "tok-matheus");
    expect(nao.status).toBe(403);
    expect((await lerJson(nao)).erro).toBe("Só o Natham desliga o Permanente.");
    expect(m.t.pastas_livres[0].permanente).toBe(true);
    expect((await m.chamar({ acao: "permanente_pasta_livre", pasta_id: pasta.id, ligado: false }, "tok-natham")).status).toBe(200);
    expect(m.t.pastas_livres[0].permanente).toBe(false);
  });
  it("com cadeado a pasta NÃO se apaga (nem Natham): nada vai para a lixeira, nenhuma linha some", async () => {
    const m = montar();
    const { pasta } = await criar(m, "Logos", { permanente: true });
    const { driveId } = await subir(m, pasta.id);
    for (const token of ["tok-natham", "tok-matheus"]) {
      const r = await m.chamar({ acao: "apagar_pasta_livre", pasta_id: pasta.id }, token);
      expect(r.status).toBe(409);
      expect((await lerJson(r)).erro).toBe("Esta pasta tem cadeado. Desligue o Permanente para apagar.");
    }
    expect(m.t.pastas_livres).toHaveLength(1);
    expect(m.t.arquivos).toHaveLength(1);
    expect(m.g.estado.arquivos.get(driveId!)!.trashed).toBe(false);
    expect(m.arvore()).toContain("Tarefas · Conteúdos/You/Logos");
  });
  it("o banco barra o apagar mesmo se a função fosse enganada (gatilho do cadeado)", async () => {
    const m = montar();
    const { pasta } = await criar(m, "Logos", { permanente: true });
    m.b.estado.rpcs.pode_apagar_pasta_livre = () => true; // finge que a pergunta ao banco deu sim
    const lida = m.t.pastas_livres[0];
    lida.permanente = false; // a função lê "sem cadeado"...
    const antes = lida;
    // ...mas na hora do delete o cadeado já está ligado (corrida): o gatilho recusa e a função responde com a mensagem do cadeado
    m.b.estado.rpcs.pode_apagar_pasta_livre = () => { antes.permanente = true; return true; };
    const r = await m.chamar({ acao: "apagar_pasta_livre", pasta_id: pasta.id });
    expect(r.status).toBe(409);
    expect(m.t.pastas_livres).toHaveLength(1);
  });
  it("sem cadeado: apaga a pasta e o que tem nela (lixeira do Drive, linhas e chave somem); outras pastas ficam", async () => {
    const m = montar();
    const a = (await criar(m, "Referências")).pasta, b = (await criar(m, "Logos")).pasta;
    const { driveId } = await subir(m, a.id);
    await subir(m, a.id, new Uint8Array(3), "dois.png", "tok-natham");
    const outro = (await subir(m, b.id, new Uint8Array(2), "logo.png")).driveId!;
    expect((await m.chamar({ acao: "apagar_pasta_livre", pasta_id: a.id }, "tok-matheus")).status).toBe(200);
    expect(m.g.estado.arquivos.get(driveId!)!.trashed).toBe(true);
    expect(m.arvore().some((p) => p.endsWith("/Referências"))).toBe(false); // a pasta (e o que tinha dentro) está na lixeira
    expect(m.t.pastas_livres.map((x) => x.nome)).toEqual(["Logos"]);
    expect(m.t.arquivos.map((x) => x.drive_id)).toEqual([outro]);
    expect(m.t.drive_pastas.some((x) => x.chave === `livre:${a.id}`)).toBe(false);
    expect(m.g.estado.arquivos.get(outro)!.trashed).toBe(false);
  });
  it("desligado o cadeado, aí apaga", async () => {
    const m = montar();
    const { pasta } = await criar(m, "Logos", { permanente: true });
    await m.chamar({ acao: "permanente_pasta_livre", pasta_id: pasta.id, ligado: false });
    expect((await m.chamar({ acao: "apagar_pasta_livre", pasta_id: pasta.id })).status).toBe(200);
    expect(m.t.pastas_livres).toHaveLength(0);
  });
  it("pasta que não existe, ou sem login, não apaga nada", async () => {
    const m = montar();
    expect((await m.chamar({ acao: "apagar_pasta_livre", pasta_id: "nao-existe" })).status).toBe(404);
    const { pasta } = await criar(m, "Logos");
    expect((await m.chamar({ acao: "apagar_pasta_livre", pasta_id: pasta.id }, "tok-ninguem")).status).toBe(401);
    expect(m.t.pastas_livres).toHaveLength(1);
  });
});

describe("234: arquivos dentro da pasta livre", () => {
  it("Natham e Matheus sobem qualquer tipo; o arquivo cai direto na pasta, vira linha com pasta_livre_id e NENHUM alarme é armado", async () => {
    const m = montar();
    const { pasta } = await criar(m, "Logos");
    const { r, driveId } = await subir(m, pasta.id);
    expect(r!.status).toBe(200);
    expect(m.t.arquivos[0]).toMatchObject({ drive_id: driveId, pasta_livre_id: pasta.id, empresa_id: "you", criado_por: "p-matheus", tipo: "imagem" });
    expect(m.t.arquivos[0].tarefa_id).toBeUndefined();
    expect(m.t.arquivos[0].formato).toBeUndefined();
    expect(m.g.estado.arquivos.get(driveId!)!.parents).toEqual([String(m.t.drive_pastas.find((x) => x.chave === `livre:${pasta.id}`)!.drive_id)]);
    const doc = await lerJson(await m.chamar({ acao: "sessao_envio_livre", pasta_id: pasta.id, nome: "a.pdf", tipo: "documento", mime: "application/pdf", tamanho: 4 }, "tok-natham"));
    expect(doc.sessao_url).toBeTruthy();
    expect(m.alarmes).toEqual([]);
  });
  it("nada sai sozinho: o alarme de limpar (só de card Postado) não toca em arquivo de pasta livre, com ou sem cadeado", async () => {
    const m = montar();
    const a = (await criar(m, "Sem cadeado")).pasta, b = (await criar(m, "Com cadeado", { permanente: true })).pasta;
    await subir(m, a.id); await subir(m, b.id, new Uint8Array(2), "b.png");
    expect((await m.campainha({ acao: "limpar", tarefa_id: "qualquer" })).status).toBe(404); // não existe card: nada a limpar
    expect(m.t.arquivos).toHaveLength(2);
  });
  it("confirmar para OUTRA pasta é recusado e repetir a confirmação não duplica", async () => {
    const m = montar();
    const a = (await criar(m, "A")).pasta, b = (await criar(m, "B")).pasta;
    const { driveId } = await subir(m, a.id);
    expect((await m.chamar({ acao: "confirmar_envio_livre", pasta_id: a.id, drive_id: driveId, nome: "logo.png", tipo: "imagem", tamanho: 5 })).status).toBe(200);
    expect(m.t.arquivos).toHaveLength(1);
    expect((await m.chamar({ acao: "confirmar_envio_livre", pasta_id: b.id, drive_id: driveId, nome: "logo.png", tipo: "imagem", tamanho: 5 })).status).toBe(409);
    const s = await lerJson(await m.chamar({ acao: "sessao_envio_livre", pasta_id: a.id, nome: "x.png", tipo: "imagem", mime: "image/png", tamanho: 2 }));
    const id2 = await enviarEmPartes(s.sessao_url, new Blob([new Uint8Array(2)]), undefined, m.g.fetch, 4);
    expect((await m.chamar({ acao: "confirmar_envio_livre", pasta_id: b.id, drive_id: id2, nome: "x.png", tipo: "imagem", tamanho: 2 })).status).toBe(422); // a etiqueta diz A
    expect(m.t.arquivos).toHaveLength(1);
  });
  it("recusa: pasta inexistente, sem login, tipo que não bate e tamanho que não bate (vai para a lixeira)", async () => {
    const m = montar();
    const { pasta } = await criar(m, "Logos");
    expect((await m.chamar({ acao: "sessao_envio_livre", pasta_id: "x", nome: "a.png", tipo: "imagem", mime: "image/png", tamanho: 1 })).status).toBe(404);
    expect((await m.chamar({ acao: "sessao_envio_livre", pasta_id: pasta.id, nome: "a.png", tipo: "imagem", mime: "image/png", tamanho: 1 }, "tok-ninguem")).status).toBe(401);
    expect((await m.chamar({ acao: "sessao_envio_livre", pasta_id: pasta.id, nome: "a.png", tipo: "imagem", mime: "application/pdf", tamanho: 1 })).status).toBe(400);
    const s = await lerJson(await m.chamar({ acao: "sessao_envio_livre", pasta_id: pasta.id, nome: "a.png", tipo: "imagem", mime: "image/png", tamanho: 8 }));
    const id = await enviarEmPartes(s.sessao_url, new Blob([new Uint8Array(8)]), undefined, m.g.fetch, 4);
    expect((await m.chamar({ acao: "confirmar_envio_livre", pasta_id: pasta.id, drive_id: id, nome: "a.png", tipo: "imagem", tamanho: 9 })).status).toBe(422);
    expect(m.g.estado.arquivos.get(id)!.trashed).toBe(true);
    expect(m.t.arquivos).toHaveLength(0);
  });
  it("apagar arquivo da pasta livre (com ou sem cadeado): vai para a lixeira, a pasta continua", async () => {
    const m = montar();
    const { pasta } = await criar(m, "Logos", { permanente: true });
    const { driveId } = await subir(m, pasta.id);
    expect((await m.chamar({ acao: "apagar_anexo", arquivo_id: String(m.t.arquivos[0].id) }, "tok-matheus")).status).toBe(200);
    expect(m.g.estado.arquivos.get(driveId!)!.trashed).toBe(true);
    expect(m.t.arquivos).toHaveLength(0);
    expect(m.t.pastas_livres).toHaveLength(1);
  });
});

describe("236: pasta livre e quem liga", () => {
  it("6 médio: criar pasta JÁ com cadeado obedece a regra de quem liga (Adrian é recusado, nada fica no Drive)", async () => {
    const m = montar();
    const r = await m.chamar({ acao: "criar_pasta_livre", empresa_id: "you", nome: "Escondida", permanente: true }, "tok-adrian");
    expect(r.status).toBe(403);
    expect(m.t.pastas_livres).toHaveLength(0);
    expect(m.arvore()).toEqual([]);
    expect((await m.chamar({ acao: "criar_pasta_livre", empresa_id: "you", nome: "Comum" }, "tok-adrian")).status).toBe(403); // pasta livre é só de Natham e Matheus
    expect((await criar(m, "Com cadeado", { permanente: true }, "tok-matheus")).pasta.permanente).toBe(true);
  });
});
