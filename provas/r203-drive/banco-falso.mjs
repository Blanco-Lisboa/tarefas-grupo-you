// Item 203 (Vitral): banco FALSO + funções `drive` e `google-autorizar` FALSAS + Drive FALSO (envio retomável) numa porta só (3296).
// Nada real: o app é servido apontando para cá (ver fotos.mjs). Estado de "Google ligado" muda em GET /__google?ligado=0|1.
import { createServer } from "node:http";

const P = { natham: "p-natham", matheus: "p-matheus", adrian: "p-adrian", lucas: "p-lucas" };
export const USUARIOS = { natham: "u-natham", matheus: "u-matheus" };
const pessoas = [
  { id: P.natham, slug: "natham", user_id: USUARIOS.natham }, { id: P.matheus, slug: "matheus", user_id: USUARIOS.matheus },
  { id: P.adrian, slug: "adrian", user_id: null }, { id: P.lucas, slug: "lucas", user_id: null },
];
const empresas = [{ id: "beec", nome: "Beec", sigla: "BE" }, { id: "you", nome: "You", sigla: "YO" }];
const ocasioes = [
  { id: "o-maes", empresa_id: "you", nome: "Dia das Mães", drive_pasta_id: "pasta-1" },
  { id: "o-natal", empresa_id: "you", nome: "Natal", drive_pasta_id: "pasta-2" },
];
let n = 0;
const t = (titulo, extra = {}) => ({
  id: `t${++n}`, titulo, tipo: "postagem", empresa_id: "you", rede: "instagram", etapa: "edicao", responsavel_id: P.matheus, inicio: "2026-10-22T12:00", fim: null,
  dia_inteiro: false, cor: "etiqueta-5", concluida: false, objetivo: null, notas: null, links: [], aprovador: "Natham",
  dono_id: P.matheus, criado_por: P.matheus, enviada_por: null, tarefa_tags: [], legenda: null, postar_redes: ["instagram", "facebook"], ocasiao_id: null, capa_quadro_ms: null, ...extra,
});
const tarefas = [
  t("Reels: 5 erros no IR", { formato: "reels", ocasiao_id: "o-maes" }),
  t("Carrossel do MEI", { formato: "carrossel", ocasiao_id: "o-maes" }),
  t("Depoimento de cliente", { etapa: "postado", concluida: true, formato: "reels", ocasiao_id: "o-natal", inicio: "2026-10-20T18:00", postar_em: "2026-10-20T18:00" }),
  t("Sem ocasião ainda", { formato: "post" }),
];
const arquivos = [
  { id: "a1", tarefa_id: "t1", caminho: null, drive_id: "drive-video-1", ordem: 0, papel: "anexo", nome: "reels-ir.mp4", tipo: "video", created_at: "2026-10-20T10:00:00Z" },
  { id: "a2", tarefa_id: "t2", caminho: null, drive_id: "drive-img-1", ordem: 0, papel: "anexo", nome: "capa-mei.png", tipo: "imagem", created_at: "2026-10-20T10:00:00Z" },
  { id: "a3", tarefa_id: "t2", caminho: null, drive_id: "drive-img-2", ordem: 1, papel: "anexo", nome: "slide-2.png", tipo: "imagem", created_at: "2026-10-20T10:01:00Z" },
];
const postagens = [
  { tarefa_id: "t3", rede: "instagram", status: "postado", link: "https://www.instagram.com/p/exemplo/", erro: null, postado_em: "2026-10-20T21:00:00Z" },
  { tarefa_id: "t3", rede: "facebook", status: "postado", link: "https://www.facebook.com/exemplo/posts/1", erro: null, postado_em: "2026-10-20T21:00:03Z" },
];
const tabelas = { pessoas, empresas, tags: [], tarefas, fazendo_agora: [], ocasioes, arquivos, postagens };
export const registro = []; // o que o navegador pediu às funções falsas (a prova lê em GET /__registro)
let googleLigado = true;
const recebido = new Map();

const sub = (req) => { try { return JSON.parse(Buffer.from((req.headers.authorization ?? "").split(".")[1], "base64url").toString()).sub; } catch { return undefined; } };
const corpoDe = (req) => new Promise((ok) => { let c = []; req.on("data", (x) => c.push(x)).on("end", () => ok(Buffer.concat(c))); });

createServer(async (req, res) => {
  res.setHeader("access-control-allow-origin", req.headers.origin ?? "*");
  res.setHeader("access-control-allow-headers", req.headers["access-control-request-headers"] ?? "*");
  res.setHeader("access-control-allow-methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader("access-control-expose-headers", "content-range,range");
  if (req.method === "OPTIONS") return res.writeHead(204).end();
  const url = new URL(req.url, "http://x");
  const json = (c, s = 200) => { res.writeHead(s, { "content-type": "application/json" }); res.end(JSON.stringify(c)); };
  if (url.pathname === "/__google") { googleLigado = url.searchParams.get("ligado") !== "0"; return json({ googleLigado }); }
  if (url.pathname === "/__registro") return json(registro);
  if (url.pathname === "/auth/v1/user") {
    const id = sub(req);
    return Object.values(USUARIOS).includes(id) ? json({ id, aud: "authenticated", role: "authenticated", email: `${id}@exemplo.invalid`, app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" }) : json({ msg: "sem sessão" }, 401);
  }
  if (url.pathname === "/functions/v1/google-autorizar") {
    registro.push({ funcao: "google-autorizar", consulta: url.search });
    if (sub(req) !== USUARIOS.natham) return json({ erro: "Só o Natham liga o Google Drive." }, 403);
    return url.searchParams.get("status") ? json({ ligado: googleLigado, email: googleLigado ? "nathamsud@gmail.com" : undefined }) : json({ url: "http://127.0.0.1:3296/google-falso-consentimento" });
  }
  if (url.pathname === "/functions/v1/drive" && req.method === "POST") {
    const c = JSON.parse((await corpoDe(req)).toString() || "{}");
    registro.push({ funcao: "drive", ...c });
    if (c.acao === "sessao_envio") return json({ sessao_url: `http://127.0.0.1:3296/upload/s${registro.length}` });
    if (c.acao === "confirmar_envio") { const id = `a-novo-${arquivos.length}`; arquivos.push({ id, tarefa_id: c.tarefa_id, caminho: null, drive_id: c.drive_id, ordem: c.ordem, papel: c.papel, nome: c.nome, tipo: c.tipo, created_at: new Date().toISOString() }); return json({ arquivo_id: id }); }
    if (c.acao === "criar_ocasiao") { const o = { id: `o-${ocasioes.length}`, empresa_id: c.empresa_id, nome: c.nome, drive_pasta_id: "p" }; ocasioes.push(o); return json({ ocasiao: o }); }
    if (c.acao === "renomear_ocasiao") { const o = ocasioes.find((x) => x.id === c.ocasiao_id); if (o) o.nome = c.nome; return json({ ok: true }); }
    return json({ ok: true });
  }
  const mUp = url.pathname.match(/^\/upload\/(s\d+)$/);
  if (mUp && req.method === "PUT") {
    const b = await corpoDe(req);
    const m = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(req.headers["content-range"] ?? "");
    registro.push({ funcao: "upload-direto", sessao: mUp[1], faixa: req.headers["content-range"], bytes: b.length });
    if (!m) return res.writeHead(308).end();
    const total = Number(m[3]); const ate = (recebido.get(mUp[1]) ?? 0) + b.length; recebido.set(mUp[1], ate);
    return ate >= total ? json({ id: `drive-${mUp[1]}` }) : (res.writeHead(308, { range: `bytes=0-${ate - 1}` }), res.end());
  }
  const tabela = url.pathname.match(/^\/rest\/v1\/(\w+)/)?.[1];
  const eu = pessoas.find((p) => p.user_id === sub(req))?.id;
  const le = (x) => x.dono_id === eu || x.enviada_por === eu || (x.etapa && x.empresa_id) || (eu === P.natham && x.dono_id === P.matheus);
  if (req.method === "GET" && tabela) return json(tabela === "tarefas" ? tarefas.filter(le) : tabelas[tabela] ?? []);
  if (tabela === "rpc") { await corpoDe(req); return json(null, 200); }
  res.writeHead(req.method === "POST" ? 201 : 200, { "content-type": "application/json" }).end(JSON.stringify([{ id: "x" }]));
}).listen(3296, "127.0.0.1", () => console.log("banco falso (203) em 127.0.0.1:3296"));
