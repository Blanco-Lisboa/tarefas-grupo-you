// Itens 198 e 199 (Vitral): banco falso local, porta 3298. Não fala com o banco de verdade.
// Guarda em memória: tarefas (salvar_tarefa), tabela arquivos e o Storage (bytes), então o F5 da página prova a leitura de volta.
import { createServer } from "node:http";

const P = { natham: "p-natham", matheus: "p-matheus" };
const pessoas = [{ id: P.natham, slug: "natham", user_id: "u-natham" }, { id: P.matheus, slug: "matheus", user_id: "u-matheus" }];
const empresas = [{ id: "beec", nome: "Beec", sigla: "BE" }, { id: "you", nome: "You", sigla: "YO" }];
let n = 0;
const t = (titulo, extra = {}) => ({
  id: `t${++n}`, titulo, tipo: "outro", empresa_id: null, rede: null, etapa: null, responsavel_id: P.natham, inicio: null, fim: null,
  dia_inteiro: false, cor: "etiqueta-5", concluida: false, objetivo: null, notas: null, links: [], aprovador: null,
  dono_id: P.natham, criado_por: P.natham, enviada_por: null, tarefa_tags: [], ...extra,
});
const tarefas = [
  t("Reels: bastidores do escritório", { tipo: "postagem", empresa_id: "you", rede: "instagram", etapa: "analise", responsavel_id: P.matheus, dono_id: P.matheus, criado_por: P.matheus }), // sem data (198)
  t("Carrossel: prazo do MEI", { tipo: "postagem", empresa_id: "beec", rede: "instagram", etapa: "edicao" }), // sem data (198)
  t("Post com data", { tipo: "postagem", empresa_id: "you", rede: "tiktok", etapa: "aprovado", inicio: "2026-10-24T10:00" }),
  t("Reunião com a Beec", { tipo: "reuniao", empresa_id: "beec", etapa: "roteiro" }), // continua fora do Mapa
  t("Anotação do caderno", { tipo: "postagem" }), // sem empresa: continua fora do Mapa
];
const arquivos = [];
const objetos = new Map(); // caminho -> { tipo, bytes }
const sub = (req) => { try { return JSON.parse(Buffer.from((req.headers.authorization ?? "").split(".")[1], "base64url").toString()).sub; } catch { return undefined; } };
const corpo = (req) => new Promise((ok) => { const c = []; req.on("data", (x) => c.push(x)).on("end", () => ok(Buffer.concat(c))); });

createServer(async (req, res) => {
  res.setHeader("access-control-allow-origin", req.headers.origin ?? "*");
  res.setHeader("access-control-allow-credentials", "true");
  res.setHeader("access-control-allow-headers", req.headers["access-control-request-headers"] ?? "*");
  res.setHeader("access-control-allow-methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader("access-control-expose-headers", "content-range");
  if (req.method === "OPTIONS") return res.writeHead(204).end();
  const url = new URL(req.url, "http://x");
  const json = (c, v) => { res.writeHead(c, { "content-type": "application/json" }); res.end(JSON.stringify(v)); };
  const p = url.pathname;
  if (p === "/auth/v1/user") { const id = sub(req); return id ? json(200, { id, aud: "authenticated", role: "authenticated", email: `${id}@exemplo.invalid`, app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" }) : json(401, { msg: "sem sessão" }); }

  // ---- Storage ----
  let m;
  if ((m = p.match(/^\/storage\/v1\/object\/sign\/arquivos$/)) && req.method === "POST") {
    const { paths } = JSON.parse((await corpo(req)).toString());
    return json(200, paths.map((c) => ({ path: c, signedURL: `/object/sign/arquivos/${c}?token=x`, error: null })));
  }
  if ((m = p.match(/^\/storage\/v1\/object\/sign\/arquivos\/(.+)$/))) {
    if (req.method === "POST") return json(200, { signedURL: `/object/sign/arquivos/${m[1]}?token=x` });
    const o = objetos.get(decodeURIComponent(m[1]));
    if (!o) return json(404, { error: "não achei" });
    res.writeHead(200, { "content-type": o.tipo }); return res.end(o.bytes);
  }
  if ((m = p.match(/^\/storage\/v1\/object\/arquivos\/(.+)$/)) && req.method === "POST") {
    // o supabase-js manda o arquivo dentro de um formulário multipart: tira o cabeçalho de cada parte e a linha final
    const bruto = await corpo(req);
    const multi = req.headers["content-type"]?.startsWith("multipart");
    const bytes = multi ? bruto.subarray(bruto.indexOf("\r\n\r\n", bruto.indexOf("filename=")) + 4, bruto.lastIndexOf("\r\n--")) : bruto;
    objetos.set(decodeURIComponent(m[1]), { tipo: multi ? "image/png" : req.headers["content-type"], bytes });
    return json(200, { Key: `arquivos/${m[1]}` });
  }
  if (p === "/storage/v1/object/arquivos" && req.method === "DELETE") {
    for (const c of JSON.parse((await corpo(req)).toString()).prefixes) objetos.delete(c);
    return json(200, []);
  }

  // ---- Tabelas ----
  if (p === "/rest/v1/rpc/salvar_tarefa") {
    const { p: linha } = JSON.parse((await corpo(req)).toString());
    const i = tarefas.findIndex((x) => x.id === linha.id);
    if (i >= 0) tarefas[i] = { ...tarefas[i], ...linha }; else tarefas.push({ ...t("x"), ...linha });
    return json(200, null);
  }
  const tabela = p.match(/^\/rest\/v1\/(\w+)/)?.[1];
  if (tabela === "arquivos") {
    if (req.method === "POST") { const l = JSON.parse((await corpo(req)).toString()); arquivos.push({ ...l, id: crypto.randomUUID(), created_at: new Date().toISOString() }); return res.writeHead(201).end(); }
    if (req.method === "DELETE") {
      const c = url.searchParams.get("caminho") ?? ""; const lista = c.replace(/^in\.\(|\)$/g, "").split(",").map((s) => s.replace(/^"|"$/g, ""));
      for (let i = arquivos.length; i--;) if (lista.includes(arquivos[i].caminho)) arquivos.splice(i, 1);
      return res.writeHead(204).end();
    }
    return json(200, arquivos);
  }
  if (req.method === "GET" && tabela) return json(200, { pessoas, empresas, tarefas, tags: [], fazendo_agora: [] }[tabela] ?? []);
  res.writeHead(req.method === "POST" ? 201 : 200, { "content-type": "application/json" }).end(JSON.stringify([{ id: "x" }]));
}).listen(3298, "127.0.0.1", () => console.log("banco falso em 127.0.0.1:3298"));
