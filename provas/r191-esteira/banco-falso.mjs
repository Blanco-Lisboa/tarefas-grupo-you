// Cópia do banco-falso do r19 + 2 reuniões do Natham com nomes diferentes (item 188). Porta 3299.
// A "Reunião com a Beec" tem empresa e etapa de propósito: sem a regra do 188 ela entraria na Esteira e no Mapa.
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
const tarefas = [
  t("Ligar para o contador", "natham", "2026-10-20T09:00"),
  t("Revisar proposta da Beec", "natham", "2026-10-20T10:30", { empresa_id: "beec" }),
  t("Post - Reels", "matheus", "2026-10-20T08:30", { tipo: "postagem", empresa_id: "you", rede: "instagram", etapa: "analise", dono_id: P.matheus, enviada_por: P.natham, objetivo: "Mostrar os bastidores do escritório e gerar contato no direct", aprovador: "Natham", tarefa_tags: [{ tag_id: "tag-esperando-aprovacao" }], links: [{ rotulo: "Vídeo", url: "https://drive.google.com/file/d/exemplo" }] }),
  t("Reels: bastidores do escritório", "natham", "2026-10-20T11:00", { tipo: "postagem", empresa_id: "you", rede: "instagram", etapa: "gravacao" }),
  t("Carrossel: prazo do MEI", "matheus", "2026-10-20T16:00", { tipo: "postagem", empresa_id: "beec", rede: "tiktok", etapa: "edicao" }),
  t("Gravar stories da semana", "matheus", "2026-10-20T14:00", { dono_id: P.matheus, criado_por: P.matheus }),
  // Item 177: tarefas enviadas (dono = quem recebe, enviada_por = quem mandou)
  t("Conferir o roteiro do Reels", "natham", "2026-10-20T13:00", { dono_id: P.natham, criado_por: P.matheus, enviada_por: P.matheus }),
  t("Mandar a logo da Beec ao contador", "matheus", "2026-10-20T09:30", { dono_id: P.matheus, criado_por: P.natham, enviada_por: P.natham }),
  // Item 177 (achado 10): dono diferente do responsável. O banco não transfere dono ao trocar o responsável.
  t("Privada do Natham, passada ao Matheus", "matheus", "2026-10-20T15:30", { dono_id: P.natham, criado_por: P.natham }),
  t("Privada do Matheus, passada ao Natham", "natham", "2026-10-20T16:30", { dono_id: P.matheus, criado_por: P.matheus }),
  t("Roteiro: 5 erros no MEI", "matheus", "2026-10-24T10:00", { tipo: "roteiro", empresa_id: "you", rede: "tiktok", etapa: "roteiro", objetivo: "Educar quem está abrindo MEI" }),
  t("Carrossel de impostos", "natham", "2026-10-18T09:00", { tipo: "edicao", empresa_id: "beec", rede: "instagram", etapa: "edicao" }),
  t("Vídeo institucional", "adrian", null, { tipo: "gravacao", empresa_id: "beec", rede: "youtube", etapa: "gravacao" }),
  t("Depoimento de cliente", "matheus", "2026-10-15T18:00", { tipo: "postagem", empresa_id: "you", rede: "instagram", etapa: "postado", concluida: true }),
  t("Dica rápida de IR", "natham", "2026-10-22T12:00", { tipo: "postagem", empresa_id: "you", rede: "kwai", etapa: "aprovado", objetivo: "Lembrar o prazo do imposto de renda" }),
  // r19: privadas do Matheus com etapa e sem empresa. Pelo 006 o banco ENTREGA ao Natham; Conteúdos, Mapa e Fila têm que esconder.
  t("Privada do Matheus: roteiro sem empresa", "matheus", "2026-10-21T10:00", { tipo: "roteiro", rede: "instagram", etapa: "roteiro", dono_id: P.matheus, criado_por: P.matheus }),
  t("Privada do Matheus: postagem sem empresa", "matheus", "2026-10-23T11:00", { tipo: "postagem", rede: "instagram", etapa: "gravacao", dono_id: P.matheus, criado_por: P.matheus }),
  t("Privada do Matheus: atrasada", "matheus", "2026-10-17T09:00", { tipo: "edicao", rede: "tiktok", etapa: "edicao", dono_id: P.matheus, criado_por: P.matheus }),
  // Item 188: reuniões (título com "Reunião", qualquer variação). Calendário e Caderno sim; Esteira, Mapa e Fila não.
  t("Reunião com a Beec: pauta de novembro", "natham", "2026-10-21T09:00", { tipo: "postagem", empresa_id: "beec", rede: "instagram", etapa: "roteiro", fim: "2026-10-21T10:00" }),
  t("reuniao de alinhamento", "natham", "2026-10-22T15:00", { fim: "2026-10-22T15:30" }),
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
