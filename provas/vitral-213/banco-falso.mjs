// Banco de mentira SÓ para fotos de tela logada (itens 155/156): responde como o Supabase, com dados inventados.
// Não fala com o banco de verdade. O app é construído apontando para ele (ver fotos.mjs). Porta 3299.
import { createServer } from "node:http";

const P = { natham: "p-natham", matheus: "p-matheus", adrian: "p-adrian", lucas: "p-lucas" };
export const USUARIOS = { natham: "u-natham", matheus: "u-matheus" };
const pessoas = [
  { id: P.natham, slug: "natham", user_id: USUARIOS.natham },
  { id: P.matheus, slug: "matheus", user_id: USUARIOS.matheus },
  { id: P.adrian, slug: "adrian", user_id: null },
  { id: P.lucas, slug: "lucas", user_id: null },
];
const empresas = [{ id: "beec", nome: "Beec", sigla: "BE" }, { id: "you", nome: "You", sigla: "YO" }];
const tags = [{ id: "tag-esperando-aprovacao", nome: "Esperando aprovação", cor: "etiqueta-1", aprovacao: true }];
let n = 0;
const t = (titulo, quem, inicio, extra = {}) => ({
  id: `t${++n}`, titulo, tipo: "outro", empresa_id: null, rede: null, etapa: null, responsavel_id: P[quem], inicio, fim: null,
  dia_inteiro: false, cor: "etiqueta-5", concluida: false, objetivo: null, notas: null, links: [], aprovador: null,
  dono_id: P.natham, criado_por: P.natham, enviada_por: null, tarefa_tags: [], ...extra,
});
const post = (titulo, empresa, inicio, extra = {}) => t(titulo, "natham", inicio, { tipo: "postagem", empresa_id: empresa, rede: "instagram", etapa: "aprovado", ...extra });
// Item 213: dia com You e Beec (2 pastas), dia só com uma empresa (1 folha), dia da Beec, dia cheio (mais de 4 folhas) e um já postado
const tarefas = [
  post("Reels: vale a pena abrir MEI?", "you", "2026-10-20T09:00", { etapa: "roteiro" }),
  post("Carrossel: prazo do MEI", "you", "2026-10-20T11:00", { etapa: "gravacao", rede: "tiktok" }),
  post("Depoimento de cliente", "you", "2026-10-20T14:00", { etapa: "edicao" }),
  post("Story: último dia do DAS", "you", "2026-10-20T17:00"),
  post("Carrossel de impostos da Beec", "beec", "2026-10-20T10:00", { etapa: "analise" }),
  post("Reels: bastidores da Beec", "beec", "2026-10-20T15:30", { etapa: "edicao", rede: "youtube" }),
  post("Dica rápida de IR", "you", "2026-10-22T12:00"),
  post("Lançamento do plano Beec", "beec", "2026-10-24T10:00", { etapa: "roteiro" }),
  post("Bastidores da equipe Beec", "beec", "2026-10-24T16:00", { etapa: "gravacao" }),
  post("Sexta das dicas 1", "you", "2026-10-27T08:00"), post("Sexta das dicas 2", "you", "2026-10-27T09:00"), post("Sexta das dicas 3", "you", "2026-10-27T10:00"),
  post("Sexta das dicas 4", "you", "2026-10-27T11:00"), post("Sexta das dicas 5", "you", "2026-10-27T12:00"), post("Sexta das dicas 6", "you", "2026-10-27T13:00"),
  post("Post já publicado", "beec", "2026-10-29T09:00", { etapa: "postado", concluida: true }),
];
// Selo "fazendo agora" (item 170): uma linha por pessoa; POST = upsert, DELETE = tira a da pessoa.
const fazendoAgora = [{ pessoa_id: P.matheus, tarefa_id: "t3", desde: "2026-10-20T08:40:00Z" }];
const tabelas = { pessoas, empresas, tags, tarefas, fazendo_agora: fazendoAgora };

const sub = (req) => {
  try { return JSON.parse(Buffer.from((req.headers.authorization ?? "").split(".")[1], "base64url").toString()).sub; } catch { return undefined; }
};
createServer((req, res) => {
  res.setHeader("access-control-allow-origin", req.headers.origin ?? "*");
  res.setHeader("access-control-allow-credentials", "true");
  res.setHeader("access-control-allow-headers", req.headers["access-control-request-headers"] ?? "*");
  res.setHeader("access-control-allow-methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader("access-control-expose-headers", "content-range");
  if (req.method === "OPTIONS") return res.writeHead(204).end();
  res.setHeader("content-type", "application/json");
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/auth/v1/user") {
    const id = sub(req);
    if (!Object.values(USUARIOS).includes(id)) return res.writeHead(401).end(JSON.stringify({ msg: "sem sessão" }));
    return res.end(JSON.stringify({ id, aud: "authenticated", role: "authenticated", email: `${id}@exemplo.invalid`, app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" }));
  }
  const tabela = url.pathname.match(/^\/rest\/v1\/(\w+)/)?.[1];
  // Mesma regra de leitura do banco de verdade (supabase/002_travas.sql, tarefas_le)
  const eu = pessoas.find((p) => p.user_id === sub(req))?.id;
  // 006: o Natham lê tudo do caderno do Matheus (só leitura)
  const le = (x) => x.dono_id === eu || x.enviada_por === eu || (x.etapa && x.empresa_id) || (eu === P.natham && x.dono_id === P.matheus);
  if (req.method === "GET" && tabela) return res.end(JSON.stringify(tabela === "tarefas" ? tarefas.filter(le) : tabelas[tabela] ?? []));
  if (tabela === "fazendo_agora" && req.method === "DELETE") {
    const quem = url.searchParams.get("pessoa_id")?.replace(/^eq\./, "");
    for (let i = fazendoAgora.length; i--;) if (fazendoAgora[i].pessoa_id === quem) fazendoAgora.splice(i, 1);
    return res.writeHead(204).end();
  }
  if (tabela === "fazendo_agora" && req.method === "POST") {
    let corpo = "";
    req.on("data", (c) => (corpo += c)).on("end", () => {
      const l = JSON.parse(corpo || "{}");
      const i = fazendoAgora.findIndex((x) => x.pessoa_id === l.pessoa_id);
      if (i >= 0) fazendoAgora[i] = l; else fazendoAgora.push(l);
      res.writeHead(201).end();
    });
    return;
  }
  res.writeHead(req.method === "POST" ? 201 : 200).end(JSON.stringify([{ id: "x" }]));
}).listen(3299, "127.0.0.1", () => console.log("banco falso em 127.0.0.1:3299"));
