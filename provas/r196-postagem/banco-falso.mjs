// Item 196 (Sextante): banco falso com um card em cada situação da postagem automática. Porta 3397. Não fala com nada de verdade.
// Também faz o papel da função `drive` (link_video devolve o vídeo-falso daqui, apagar_tarefa só registra) e das RPCs postar_agora / tentar_de_novo.
// Regras copiadas do 019 que a prova precisa ver: só Natham/aprovador leva Aprovado -> Postado (42501); Aprovado/Postado só para Postagem (23514).
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

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
  t("Depoimento de cliente", { etapa: "postado", formato: "reels", postar_em: "2026-10-15T18:00" }),
  t("Post sem legenda", { formato: "post", legenda: null, postar_em: "2026-10-26T10:00" }),
  t("Reels da Beec", { empresa_id: "beec", formato: "reels", aprovador: "Matheus", postar_em: "2026-10-27T12:00" }),
  t("Visita ao cliente 2", { tipo: "gravacao", etapa: "edicao", formato: null, legenda: null, postar_redes: ["instagram", "facebook"] }),
  t("Reels: 5 erros no IR", { etapa: "edicao", conserto: true, formato: "reels" }),
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
  if (url.pathname === "/auth/v1/user") {
    if (!eu) return json(res, 401, { msg: "sem sessão" });
    return json(res, 200, { id: eu.user_id, aud: "authenticated", role: "authenticated", email: `${eu.slug}@exemplo.invalid`, app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" });
  }
  if (url.pathname === "/functions/v1/drive") {
    const c = await corpo(req);
    chamadas.push({ funcao: "drive", ...c });
    console.log("drive", JSON.stringify(c));
    if (c.acao === "link_video") return json(res, 200, { url: "http://127.0.0.1:3397/video-falso.mp4" });
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
    }
    if (rpc === "tentar_de_novo") for (const p of postagens) if (p.tarefa_id === c.p_tarefa && p.status === "erro") Object.assign(p, { status: "fila", erro: null });
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
}).listen(3397, "127.0.0.1", () => console.log("banco falso em 127.0.0.1:3397"));
