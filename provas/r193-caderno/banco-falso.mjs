// Item 193 (Pena): banco falso local, porta 3293. Não fala com o banco de verdade. Imita a regra do 014:
// cada um lê e escreve as anotações dele; o Natham LÊ as do Matheus; o Matheus nunca lê as do Natham.
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
let n = 0;
const t = (titulo, quem, inicio, extra = {}) => ({
  id: `t${++n}`, titulo, tipo: "outro", empresa_id: null, rede: null, etapa: null, responsavel_id: P[quem], inicio, fim: null,
  dia_inteiro: false, cor: "etiqueta-5", concluida: false, objetivo: null, notas: null, links: [], aprovador: null,
  dono_id: P[quem], criado_por: P[quem], enviada_por: null, tarefa_tags: [], ...extra,
});
const tarefas = [
  t("Gravar o reels do IR", "matheus", "2026-10-20T10:00", { fim: "2026-10-20T10:30" }),
  t("Responder comentários da Beec", "matheus", "2026-10-20T14:30", { fim: "2026-10-20T15:00" }),
  t("Roteiro de amanhã: prazo do MEI", "matheus", "2026-10-21T09:00", { fim: "2026-10-21T09:30" }),
  t("Fechar o relatório do mês", "natham", "2026-10-20T11:00", { fim: "2026-10-20T11:30" }),
];
const agenda_eventos = [
  { id: "e1", fontes: ["matheus"], titulo: "Alinhamento de pauta com a Beec", particular: false, inicio: "2026-10-20T15:00:00+00:00", fim: "2026-10-20T16:00:00+00:00", dia_inteiro: false, local: "Google Meet" },
  { id: "e2", fontes: ["natham"], titulo: "Reunião de diretoria", particular: false, inicio: "2026-10-20T13:00:00+00:00", fim: "2026-10-20T14:00:00+00:00", dia_inteiro: false, local: null },
];
const acesso = { natham: ["natham", "matheus", "adrian", "adrian_pessoal", "contato"], matheus: ["matheus", "adrian", "adrian_pessoal", "contato"] };
// Anotações (014). Semente: o Matheus escreveu no dia 20; o Natham também.
export const anotacoes_dia = [
  { dono_id: P.matheus, dia: "2026-10-20", texto: "Ligar para o cliente da Beec depois do almoço.\nPedir a arte do carrossel ao Adrian." },
  { dono_id: P.natham, dia: "2026-10-20", texto: "Revisar a aprovação dos reels (Natham)." },
];
export const nao_esquecer = [
  { dono_id: P.matheus, dia: "2026-10-20", texto: "Senha do Canva: pedir ao Natham." },
];
const tabelas = { pessoas, empresas, tags: [], tarefas, fazendo_agora: [], agenda_eventos, anotacoes_dia, nao_esquecer };
export const registro = []; // o que o app mandou gravar: { tabela, quem, linha }

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
  const uid = sub(req);
  if (url.pathname === "/auth/v1/user") {
    if (!Object.values(USUARIOS).includes(uid)) return res.writeHead(401).end(JSON.stringify({ msg: "sem sessão" }));
    return res.end(JSON.stringify({ id: uid, aud: "authenticated", role: "authenticated", email: `${uid}@exemplo.invalid`, app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" }));
  }
  const eu = pessoas.find((p) => p.user_id === uid)?.id;
  const slug = pessoas.find((p) => p.id === eu)?.slug;
  if (url.pathname === "/rest/v1/rpc/tarefas_no_google") return res.end("[]");
  if (url.pathname === "/__registro") return res.end(JSON.stringify({ registro, anotacoes_dia, nao_esquecer }));
  const tabela = url.pathname.match(/^\/rest\/v1\/(\w+)/)?.[1];
  const leNota = (x) => x.dono_id === eu || (eu === P.natham && x.dono_id === P.matheus);
  const le = (x) => x.dono_id === eu || (eu === P.natham && x.dono_id === P.matheus);
  if (req.method === "GET" && tabela) {
    let linhas = tabelas[tabela] ?? [];
    if (tabela === "tarefas") linhas = linhas.filter(le);
    if (tabela === "anotacoes_dia" || tabela === "nao_esquecer") {
      linhas = linhas.filter(leNota);
      for (const [campo, valor] of url.searchParams) {
        if (valor.startsWith("eq.")) linhas = linhas.filter((l) => String(l[campo]) === valor.slice(3));
        if (valor.startsWith("in.(")) linhas = linhas.filter((l) => valor.slice(4, -1).split(",").includes(String(l[campo])));
      }
    }
    if (tabela === "agenda_acesso") linhas = (acesso[slug] ?? []).map((fonte) => ({ fonte }));
    if (tabela === "agenda_eventos") linhas = linhas.filter((e) => e.fontes.some((f) => (acesso[slug] ?? []).includes(f)));
    return res.end(JSON.stringify(linhas));
  }
  if ((tabela === "anotacoes_dia" || tabela === "nao_esquecer") && req.method === "POST") {
    let corpo = "";
    req.on("data", (c) => (corpo += c)).on("end", () => {
      const ignorar = (req.headers.prefer ?? "").includes("ignore-duplicates");
      for (const l of [].concat(JSON.parse(corpo || "[]"))) {
        if (l.dono_id !== eu) return res.writeHead(403).end(JSON.stringify({ code: "42501", message: "RLS" })); // só escreve a própria
        const i = tabelas[tabela].findIndex((x) => x.dono_id === l.dono_id && x.dia === l.dia);
        registro.push({ tabela, quem: slug, linha: l });
        if (i < 0) tabelas[tabela].push(l); else if (!ignorar) tabelas[tabela][i] = l;
      }
      res.writeHead(201).end();
    });
    return;
  }
  res.writeHead(req.method === "POST" ? 201 : 200).end(JSON.stringify([{ id: "x" }]));
}).listen(3293, "127.0.0.1", () => console.log("banco falso em 127.0.0.1:3293"));
