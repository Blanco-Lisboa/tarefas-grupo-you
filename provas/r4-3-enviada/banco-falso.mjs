// Banco de mentira (R4-3): igual ao do pente fino, mas COM memória e com a trava do 009 (enviada: só quem enviou altera/apaga).
// Não fala com o banco de verdade. Porta 3299. GET /__estado devolve as tarefas para a prova conferir.
import { createServer } from "node:http";

const P = { natham: "p-natham", matheus: "p-matheus", adrian: "p-adrian", lucas: "p-lucas" };
export const USUARIOS = { natham: "u-natham", matheus: "u-matheus" };
const pessoas = [
  { id: P.natham, slug: "natham", user_id: USUARIOS.natham }, { id: P.matheus, slug: "matheus", user_id: USUARIOS.matheus },
  { id: P.adrian, slug: "adrian", user_id: null }, { id: P.lucas, slug: "lucas", user_id: null },
];
const t = (id, titulo, dono, extra = {}) => ({
  id, titulo, tipo: "outro", empresa_id: null, rede: null, etapa: null, responsavel_id: P[dono], inicio: "2026-10-20T10:00", fim: null,
  dia_inteiro: false, cor: "etiqueta-5", concluida: false, objetivo: null, notas: null, links: [], aprovador: null,
  dono_id: P[dono], criado_por: P[dono], enviada_por: null, tarefa_tags: [], ...extra,
});
let tarefas = [
  t("t1", "Matheus manda ao Natham", "natham", { enviada_por: P.matheus, criado_por: P.matheus }),
  t("t2", "Natham manda ao Matheus", "matheus", { enviada_por: P.natham, criado_por: P.natham, inicio: "2026-10-20T11:00" }),
  t("t3", "Pessoal do Natham", "natham", { inicio: "2026-10-20T14:00" }),
  t("t4", "Pessoal do Matheus", "matheus", { inicio: "2026-10-20T15:00" }),
  t("t5", "Matheus manda sem data", "natham", { enviada_por: P.matheus, criado_por: P.matheus, inicio: null }),
];
const sub = (req) => { try { return JSON.parse(Buffer.from((req.headers.authorization ?? "").split(".")[1], "base64url").toString()).sub; } catch { return undefined; } };
const corpo = (req) => new Promise((ok) => { let s = ""; req.on("data", (c) => (s += c)); req.on("end", () => ok(s ? JSON.parse(s) : null)); });
createServer(async (req, res) => {
  res.setHeader("access-control-allow-origin", req.headers.origin ?? "*");
  res.setHeader("access-control-allow-credentials", "true");
  res.setHeader("access-control-allow-headers", req.headers["access-control-request-headers"] ?? "*");
  res.setHeader("access-control-allow-methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader("access-control-expose-headers", "content-range");
  if (req.method === "OPTIONS") return res.writeHead(204).end();
  res.setHeader("content-type", "application/json");
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/__estado") return res.end(JSON.stringify(tarefas));
  const id = sub(req);
  if (url.pathname === "/auth/v1/user") {
    if (!Object.values(USUARIOS).includes(id)) return res.writeHead(401).end(JSON.stringify({ msg: "sem sessão" }));
    return res.end(JSON.stringify({ id, aud: "authenticated", role: "authenticated", email: `${id}@exemplo.invalid`, app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" }));
  }
  const tabela = url.pathname.match(/^\/rest\/v1\/(\w+)/)?.[1];
  const eu = pessoas.find((p) => p.user_id === id)?.id;
  const le = (x) => x.dono_id === eu || x.enviada_por === eu || (x.etapa && x.empresa_id);
  const altera = (x) => (x.enviada_por ? x.enviada_por === eu : x.dono_id === eu || (x.etapa && x.empresa_id)); // trava do 009
  if (req.method === "GET" && tabela) return res.end(JSON.stringify({ pessoas, empresas: [], tags: [], tarefas: tarefas.filter(le), fazendo_agora: [] }[tabela] ?? []));
  if (req.method === "POST" && url.pathname.endsWith("/rpc/salvar_tarefa")) {
    const { p } = await corpo(req);
    const antes = tarefas.find((x) => x.id === p.id);
    if (antes && !altera(antes)) return res.writeHead(403).end(JSON.stringify({ message: "negado" }));
    tarefas = antes ? tarefas.map((x) => (x.id === p.id ? { ...x, ...p } : x)) : [...tarefas, { ...p, tarefa_tags: [] }];
    return res.end("null");
  }
  if (req.method === "DELETE" && tabela === "tarefas") {
    const alvo = tarefas.find((x) => x.id === url.searchParams.get("id")?.replace("eq.", ""));
    const ok = alvo && (alvo.enviada_por ?? alvo.dono_id) === eu;
    if (ok) tarefas = tarefas.filter((x) => x !== alvo);
    return res.end(JSON.stringify(ok ? [{ id: alvo.id }] : []));
  }
  res.writeHead(req.method === "POST" ? 201 : 200).end(JSON.stringify([{ id: "x" }]));
}).listen(3299, "127.0.0.1", () => console.log("banco falso em 127.0.0.1:3299"));
