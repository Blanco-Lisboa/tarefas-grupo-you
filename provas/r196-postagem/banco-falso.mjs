// Item 196 (Sextante): banco falso com um card em cada situação da postagem automática. Porta 3397. Não fala com nada de verdade.
// Também faz o papel da função `drive` (link_video devolve o vídeo-falso daqui, apagar_tarefa só registra) e das RPCs postar_agora / tentar_de_novo.
// PREVIA=1 (prévia para o Natham testar com as mãos, porta PORTA): entra como Natham por /entrar, recebe anexos num Drive de mentira
// (o vídeo enviado toca na barrinha da capa) e faz o papel da função postar-meta: fila -> enviando -> postado, com link de exemplo,
// e posta sozinho o card Aprovado quando a hora marcada chega. Nada sai do PC. Sem PREVIA, é o banco da prova (fotos.mjs).
// Regras copiadas do 019 que a prova precisa ver: só Natham/aprovador leva Aprovado -> Postado (42501); Aprovado/Postado só para Postagem (23514).
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const PREVIA = process.env.PREVIA === "1";
const PORTA = Number(process.env.PORTA ?? 3397);
const BASE = `http://127.0.0.1:${PORTA}`;

const VIDEO = readFileSync(new URL("./video-falso.mp4", import.meta.url));
const P = { natham: "p-natham", matheus: "p-matheus", adrian: "p-adrian", lucas: "p-lucas" };
const pessoas = [
  { id: P.natham, slug: "natham", user_id: "u-natham" }, { id: P.matheus, slug: "matheus", user_id: "u-matheus" },
  { id: P.adrian, slug: "adrian", user_id: null }, { id: P.lucas, slug: "lucas", user_id: null },
];
const empresas = [{ id: "beec", nome: "Beec", sigla: "BE" }, { id: "you", nome: "You", sigla: "YO" }];
let n = 0;
const t = (titulo, extra = {}) => ({
  id: `t${++n}`, titulo, tipo: "postagem", empresa_id: "you", rede: "instagram", etapa: "aprovado", responsavel_id: P.matheus, inicio: null, fim: null,
  dia_inteiro: false, cor: "etiqueta-5", concluida: false, objetivo: null, notas: null, links: [], aprovador: "Natham",
  dono_id: P.matheus, criado_por: P.matheus, enviada_por: null, tarefa_tags: [], legenda: "Texto do post", postar_redes: ["instagram", "facebook"], ...extra,
});
const tarefas = [
  t("Reels: bastidores do escritório", { etapa: "analise", formato: "reels", legenda: "Um dia na You: como a gente fecha o mês dos clientes." }),
  t("Dica rápida de IR", { formato: "post", postar_em: "2026-10-25T18:00" }),
  t("Carrossel: prazo do MEI", { formato: "carrossel", postar_em: "2026-10-20T09:00" }),
  t("Story: último dia do DAS", { formato: "story", postar_em: "2026-10-20T14:58", postar_redes: ["instagram"] }),
  t("Reels: vale a pena abrir MEI?", { formato: "reels", postar_em: "2026-10-20T08:00" }),
  t("Depoimento de cliente", { etapa: "postado", formato: "reels", postar_em: "2026-10-15T18:00", inicio: "2026-10-15T18:00" }),
  t("Post sem legenda", { formato: "post", legenda: null, postar_em: "2026-10-26T10:00" }),
  t("Reels da Beec", { empresa_id: "beec", formato: "reels", aprovador: "Matheus", postar_em: "2026-10-27T12:00" }),
  t("Visita ao cliente 2", { tipo: "gravacao", etapa: "edicao", formato: null, legenda: null, postar_redes: ["instagram", "facebook"] }),
  t("Reels: 5 erros no IR", { etapa: "edicao", conserto: true, formato: "reels" }),
  // Achado 3 da Lupa no Correio: carrossel com vídeo gravado com as duas redes (antes do conserto); salvar a ficha grava só o Instagram.
  t("Carrossel com vídeo antigo", { formato: "carrossel", postar_em: "2026-10-27T10:00" }),
];
const id = (titulo) => tarefas.find((x) => x.titulo === titulo).id;
const arq = (titulo, nome, tipo, extra = {}) => ({ id: `a-${nome}`, tarefa_id: id(titulo), caminho: null, drive_id: `drive-${nome}`, nome, tipo, tamanho: 1, ordem: 0, papel: "anexo", ...extra });
const arquivos = [
  arq("Reels: bastidores do escritório", "bastidores.mp4", "video"),
  arq("Dica rápida de IR", "dica.png", "imagem"),
  arq("Carrossel: prazo do MEI", "mei-1.jpg", "imagem"), arq("Carrossel: prazo do MEI", "mei-2.mp4", "video", { ordem: 1 }),
  arq("Story: último dia do DAS", "das.jpg", "imagem"),
  arq("Reels: vale a pena abrir MEI?", "mei.mp4", "video"),
  arq("Post sem legenda", "sem.png", "imagem"),
  arq("Carrossel com vídeo antigo", "antigo-1.jpg", "imagem"), arq("Carrossel com vídeo antigo", "antigo-2.mp4", "video", { ordem: 1 }),
];
const postagens = [
  { tarefa_id: id("Carrossel: prazo do MEI"), rede: "instagram", status: "postado", link: "https://www.instagram.com/p/EXEMPLO1/", erro: null, postado_em: "2026-10-20T12:00:00Z" },
  { tarefa_id: id("Carrossel: prazo do MEI"), rede: "facebook", status: "erro", link: null, erro: "o Facebook não aceita foto e vídeo no mesmo post", postado_em: null },
  { tarefa_id: id("Story: último dia do DAS"), rede: "instagram", status: "enviando", link: null, erro: null, postado_em: null },
  { tarefa_id: id("Reels: vale a pena abrir MEI?"), rede: "instagram", status: "erro", link: null, erro: "estado incerto: confira a rede antes de tentar de novo", postado_em: null },
  { tarefa_id: id("Depoimento de cliente"), rede: "instagram", status: "postado", link: "https://www.instagram.com/reel/EXEMPLO2/", erro: null, postado_em: "2026-10-15T21:00:00Z" },
  { tarefa_id: id("Depoimento de cliente"), rede: "facebook", status: "postado", link: "https://www.facebook.com/EXEMPLO3", erro: null, postado_em: "2026-10-15T21:00:00Z" },
];
export const chamadas = [];
const tabelas = { pessoas, empresas, tags: [], tarefas, arquivos, postagens, fazendo_agora: [], ocasioes: [{ id: "o1", empresa_id: "you", nome: "Bastidores de outubro" }] };

// Prévia: o Mapa desenha pela data do card (inicio) e a partir de hoje; o card programado ganha a data do post e o postado de exemplo é de hoje.
if (PREVIA) {
  const hoje = new Date(), dia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  Object.assign(tarefas.find((x) => x.titulo === "Depoimento de cliente"), { postar_em: `${dia}T09:00`, inicio: `${dia}T09:00` });
  for (const x of tarefas) if (x.postar_em && !x.inicio) x.inicio = x.postar_em;
}
// Prévia: Drive de mentira (bytes na memória) e a função de postar simulada.
const driveBytes = new Map();
const sessoes = new Map();
const local = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
function postarSimulado(tarefaId) {
  const alvo = tarefas.find((x) => x.id === tarefaId);
  if (!alvo || alvo.etapa !== "aprovado") return;
  for (const rede of alvo.postar_redes ?? ["instagram", "facebook"]) if (!postagens.some((p) => p.tarefa_id === alvo.id && p.rede === rede)) postagens.push({ tarefa_id: alvo.id, rede, status: "fila", link: null, erro: null, postado_em: null });
  const minhas = () => postagens.filter((p) => p.tarefa_id === alvo.id && p.status !== "postado");
  setTimeout(() => minhas().forEach((p) => (p.status = "enviando")), 3000);
  setTimeout(() => {
    for (const p of minhas()) Object.assign(p, { status: "postado", link: p.rede === "instagram" ? "https://www.instagram.com/p/PREVIA/" : "https://www.facebook.com/PREVIA", postado_em: new Date().toISOString() });
    if (postagens.filter((p) => p.tarefa_id === alvo.id).every((p) => p.status === "postado")) alvo.etapa = "postado";
    console.log("previa: postado", alvo.titulo);
  }, 10000);
}
// O "despertador": card Aprovado cuja hora chegou e que ainda não começou a postar.
if (PREVIA) setInterval(() => {
  for (const x of tarefas) if (x.etapa === "aprovado" && x.postar_em && x.postar_em <= local() && !postagens.some((p) => p.tarefa_id === x.id)) postarSimulado(x.id);
}, 10000);
function sessaoNatham() {
  const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const exp = 1893456000, uid = "u-natham";
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  return `base64-${b64({ access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "natham@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } })}`;
}

const sub = (req) => { try { return JSON.parse(Buffer.from((req.headers.authorization ?? "").split(".")[1], "base64url").toString()).sub; } catch { return undefined; } };
const corpo = (req) => new Promise((ok) => { let c = ""; req.on("data", (x) => (c += x)).on("end", () => ok(c ? JSON.parse(c) : {})); });
const json = (res, status, v) => res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(v));

createServer(async (req, res) => {
  res.setHeader("access-control-allow-origin", req.headers.origin ?? "*");
  res.setHeader("access-control-allow-credentials", "true");
  res.setHeader("access-control-allow-headers", req.headers["access-control-request-headers"] ?? "*");
  res.setHeader("access-control-allow-methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader("access-control-expose-headers", "content-range");
  if (req.method === "OPTIONS") return res.writeHead(204).end();
  const url = new URL(req.url, "http://x");
  const eu = pessoas.find((p) => p.user_id === sub(req));
  if (url.pathname === "/video-falso.mp4") {
    // Com Range, como o link do Vitral: o <video> pula para qualquer quadro.
    const [, a, b] = /bytes=(\d+)-(\d*)/.exec(req.headers.range ?? "") ?? [];
    if (a === undefined) return res.writeHead(200, { "content-type": "video/mp4", "accept-ranges": "bytes", "content-length": VIDEO.length }).end(VIDEO);
    const fim = b ? Number(b) : VIDEO.length - 1;
    return res.writeHead(206, { "content-type": "video/mp4", "accept-ranges": "bytes", "content-range": `bytes ${a}-${fim}/${VIDEO.length}`, "content-length": fim - Number(a) + 1 }).end(VIDEO.subarray(Number(a), fim + 1));
  }
  if (PREVIA && url.pathname === "/entrar") {
    // O cookie vale para 127.0.0.1 em qualquer porta: grava a sessão do Natham e manda para a Esteira do app.
    return res.writeHead(302, { "set-cookie": `sb-127-auth-token=${sessaoNatham()}; Path=/; SameSite=Lax`, location: `http://127.0.0.1:${url.searchParams.get("app") ?? 3198}/conteudos` }).end();
  }
  if (PREVIA && url.pathname.startsWith("/drive-envio/") && req.method === "PUT") {
    // Sessão de envio do Drive de mentira: junta as partes; na última devolve o id, como o Google.
    const chave = url.pathname.split("/")[2], partes = [];
    req.on("data", (x) => partes.push(x)).on("end", () => {
      const [, , fim, total] = /bytes (\d+)-(\d+)\/(\d+)/.exec(req.headers["content-range"] ?? "") ?? [];
      const s = sessoes.get(chave) ?? [];
      s.push(Buffer.concat(partes));
      sessoes.set(chave, s);
      if (fim === undefined || Number(fim) + 1 >= Number(total)) { driveBytes.set(`drive-${chave}`, Buffer.concat(s)); return json(res, 200, { id: `drive-${chave}` }); }
      res.writeHead(308, { range: `bytes=0-${fim}` }).end();
    });
    return;
  }
  if (PREVIA && url.pathname.startsWith("/drive-video/")) {
    const bytes = driveBytes.get(arquivos.find((a) => a.id === url.pathname.split("/")[2])?.drive_id) ?? VIDEO;
    const [, a, b] = /bytes=(\d+)-(\d*)/.exec(req.headers.range ?? "") ?? [];
    if (a === undefined) return res.writeHead(200, { "content-type": "video/mp4", "accept-ranges": "bytes", "content-length": bytes.length }).end(bytes);
    const fim = b ? Number(b) : bytes.length - 1;
    return res.writeHead(206, { "content-type": "video/mp4", "accept-ranges": "bytes", "content-range": `bytes ${a}-${fim}/${bytes.length}`, "content-length": fim - Number(a) + 1 }).end(bytes.subarray(Number(a), fim + 1));
  }
  if (url.pathname === "/functions/v1/google-autorizar") return json(res, 200, { ligado: false });
  if (url.pathname === "/auth/v1/user") {
    if (!eu) return json(res, 401, { msg: "sem sessão" });
    return json(res, 200, { id: eu.user_id, aud: "authenticated", role: "authenticated", email: `${eu.slug}@exemplo.invalid`, app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" });
  }
  if (url.pathname === "/functions/v1/drive") {
    const c = await corpo(req);
    chamadas.push({ funcao: "drive", ...c });
    console.log("drive", JSON.stringify(c));
    if (c.acao === "link_video") return json(res, 200, { url: PREVIA ? `${BASE}/drive-video/${c.arquivo_id}` : `${BASE}/video-falso.mp4` });
    if (PREVIA && c.acao === "sessao_envio") return json(res, 200, { sessao_url: `${BASE}/drive-envio/${Math.random().toString(36).slice(2, 10)}` });
    if (PREVIA && c.acao === "confirmar_envio") {
      const linha = { id: `a-${c.drive_id}`, tarefa_id: c.tarefa_id, caminho: null, drive_id: c.drive_id, nome: c.nome, tipo: c.tipo, tamanho: c.tamanho, ordem: c.ordem ?? 0, papel: c.papel ?? "anexo" };
      if (linha.papel === "capa") for (let i = arquivos.length; i--;) if (arquivos[i].tarefa_id === c.tarefa_id && arquivos[i].papel === "capa") arquivos.splice(i, 1);
      arquivos.push(linha);
      return json(res, 200, { arquivo_id: linha.id });
    }
    if (PREVIA && c.acao === "apagar_anexo") { const i = arquivos.findIndex((a) => a.id === c.arquivo_id); if (i >= 0) arquivos.splice(i, 1); }
    if (c.acao === "apagar_tarefa") { const i = tarefas.findIndex((x) => x.id === c.tarefa_id); if (i >= 0) tarefas.splice(i, 1); }
    return json(res, 200, {});
  }
  const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/(\w+)/)?.[1];
  if (rpc) {
    const c = await corpo(req);
    console.log("rpc", rpc, JSON.stringify(c));
    if (rpc === "salvar_tarefa") {
      const atual = tarefas.find((x) => x.id === c.p.id);
      const aprova = eu?.slug === "natham" || eu?.slug === (atual?.aprovador ?? "").toLowerCase();
      if (["aprovado", "postado"].includes(c.p.etapa) && c.p.tipo !== "postagem") return json(res, 400, { code: "23514", message: "so card do tipo Postagem vai para Aprovado ou Postado; os outros terminam em Concluir" });
      if (atual?.etapa === "aprovado" && c.p.etapa === "postado" && !aprova) return json(res, 403, { code: "42501", message: "so o Natham ou o aprovador" });
      if (atual) Object.assign(atual, c.p); else tarefas.push({ ...c.p, tarefa_tags: [] });
      return res.writeHead(204).end();
    }
    if (rpc === "postar_agora") {
      const alvo = tarefas.find((x) => x.id === c.p_tarefa);
      for (const rede of alvo.postar_redes) if (!postagens.some((p) => p.tarefa_id === alvo.id && p.rede === rede)) postagens.push({ tarefa_id: alvo.id, rede, status: "fila", link: null, erro: null, postado_em: null });
      if (PREVIA) { alvo.postar_em = local(); postarSimulado(alvo.id); }
    }
    if (rpc === "tentar_de_novo") {
      for (const p of postagens) if (p.tarefa_id === c.p_tarefa && p.status === "erro") Object.assign(p, { status: "fila", erro: null });
      if (PREVIA) postarSimulado(c.p_tarefa);
    }
    chamadas.push({ rpc, ...c });
    return res.writeHead(204).end();
  }
  const tabela = url.pathname.match(/^\/rest\/v1\/(\w+)/)?.[1];
  if (tabela === "tarefas" && req.method === "DELETE") {
    const alvo = url.searchParams.get("id")?.replace(/^eq\./, "");
    const i = tarefas.findIndex((x) => x.id === alvo);
    console.log("apagar", alvo);
    if (i >= 0) tarefas.splice(i, 1);
    return json(res, 200, [{ id: alvo }]);
  }
  if (req.method === "GET" && tabela) return json(res, 200, tabelas[tabela] ?? []);
  if (url.pathname.startsWith("/storage/")) return json(res, 200, []);
  json(res, req.method === "POST" ? 201 : 200, [{ id: "x" }]);
}).listen(PORTA, "127.0.0.1", () => console.log(`banco falso em 127.0.0.1:${PORTA}${PREVIA ? " (prévia: entre por /entrar)" : ""}`));
