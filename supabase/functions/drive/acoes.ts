// Função `drive`: tudo que mexe no Google Drive em nome do app. Sem Deno aqui dentro (index.ts é quem liga o servidor): roda igual no Vitest.
// Duas chaves: a do USUÁRIO (as travas do banco decidem se pode) e a de SERVIÇO (só para gravar o que só esta função grava).
import { assinar, conferir, iguais } from "../_shared/google.ts";
import type { DriveApi } from "./drive-api.ts";
import { ErroDrive } from "./drive-api.ts";
import { criarRest, ErroRest, type Linha, type Rest } from "./rest.ts";

type Busca = typeof fetch;
export type Deps = {
  env: (n: string) => string | undefined;
  fetch: Busca;
  api: DriveApi;
  baixar: (driveId: string, range?: string | null) => Promise<Response>;
  agora?: () => number;
};

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-expose-headers": "content-range, accept-ranges, content-length",
};
const json = (status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status, headers: { ...CORS, "content-type": "application/json" } });
class Recusa extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
  }
}
const TIPOS = ["imagem", "video", "documento"];
const MAX_BYTES = 5 * 1024 ** 3;
const nomeOk = (n: unknown, max = 120) => (typeof n === "string" && n.trim() && n.trim().length <= max ? n.trim() : undefined);
const texto = (v: unknown) => (typeof v === "string" ? v : undefined);

export function criarManipulador(d: Deps) {
  const agora = d.agora ?? Date.now;
  const url = () => d.env("SUPABASE_URL")!;
  const servico = (): Rest => criarRest(url(), d.env("SUPABASE_SERVICE_ROLE_KEY")!, d.env("SUPABASE_SERVICE_ROLE_KEY")!, d.fetch);
  const doUsuario = (token: string): Rest => criarRest(url(), d.env("SUPABASE_ANON_KEY")!, token, d.fetch);
  let segredoMemo: string | undefined;
  async function segredo(): Promise<string> {
    segredoMemo ??= (await servico().rpc<string | null>("ler_segredo_servico", { p_nome: "tarefas_funcoes_segredo" })) ?? undefined;
    if (!segredoMemo) throw new Recusa(500, "Segredo interno ausente");
    return segredoMemo;
  }

  /** Quem está chamando: o Supabase confere a chave; devolve a pessoa (id e slug) ligada ao login. */
  async function pessoaDe(token: string) {
    const r = await d.fetch(`${url()}/auth/v1/user`, { headers: { apikey: d.env("SUPABASE_ANON_KEY")!, authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Recusa(401, "Entre de novo no sistema.");
    const { id } = (await r.json()) as { id: string };
    const [p] = await servico().ler<{ id: string; slug: string }>("pessoas", { user_id: id }, "id,slug");
    if (!p) throw new Recusa(403, "Seu login não está ligado a uma pessoa.");
    return p;
  }
  const exigir = (ok: unknown, status: number, msg: string) => { if (ok !== true) throw new Recusa(status, msg); };

  // ---- pastas no Drive ----
  async function pastaFixa(chave: string, criar: () => Promise<string>): Promise<string> {
    const s = servico();
    const [x] = await s.ler<{ drive_id: string }>("drive_pastas", { chave }, "drive_id");
    if (x) return x.drive_id;
    const id = await criar();
    if ((await s.inserir("drive_pastas", { chave, drive_id: id }, "chave")).length) return id;
    await d.api.lixeira(id); // outra chamada criou ao mesmo tempo: fica a dela
    return (await s.ler<{ drive_id: string }>("drive_pastas", { chave }, "drive_id"))[0].drive_id;
  }
  const pastaRaiz = () => pastaFixa("raiz", async () => {
    const id = await d.api.criarPasta("Tarefas · Conteúdos");
    const email = d.env("DRIVE_COMPARTILHAR_COM"); // e-mail do Matheus (D3); sem ele, a pasta fica só do Natham
    if (email) await d.api.compartilhar(id, email);
    return id;
  });
  async function pastaEmpresa(empresaId: string) {
    const [e] = await servico().ler<{ nome: string }>("empresas", { id: empresaId }, "nome");
    if (!e) throw new Recusa(404, "Empresa não encontrada.");
    const raiz = await pastaRaiz();
    return pastaFixa(`empresa:${empresaId}`, () => d.api.criarPasta(e.nome, raiz));
  }
  /** Cria a ocasião (linha + pasta). `reusar`: se o nome já existe na empresa, devolve a existente em vez de recusar. */
  async function novaOcasiao(empresaId: string, nome: string, pessoaId: string, reusar: boolean): Promise<Linha> {
    const s = servico();
    const igual = (await s.ler("ocasioes", { empresa_id: empresaId })).find((o) => String(o.nome).trim().toLowerCase() === nome.toLowerCase());
    if (igual) { if (reusar) return igual; throw new Recusa(409, "Já existe uma ocasião com esse nome."); }
    const pasta = await d.api.criarPasta(nome, await pastaEmpresa(empresaId));
    try {
      return (await s.inserir("ocasioes", { empresa_id: empresaId, nome, drive_pasta_id: pasta, criado_por: pessoaId }))[0];
    } catch (e) {
      await d.api.lixeira(pasta).catch(() => {});
      if (e instanceof ErroRest && e.status === 409) {
        if (reusar) return (await s.ler("ocasioes", { empresa_id: empresaId })).find((o) => String(o.nome).trim().toLowerCase() === nome.toLowerCase())!;
        throw new Recusa(409, "Já existe uma ocasião com esse nome.");
      }
      throw e;
    }
  }
  type Card = { id: string; titulo: string; empresa_id: string | null; ocasiao_id: string | null; etapa: string | null };
  const cardDe = async (id: string): Promise<Card> => {
    const [t] = await servico().ler<Card>("tarefas", { id }, "id,titulo,empresa_id,ocasiao_id,etapa");
    if (!t) throw new Recusa(404, "Card não encontrado.");
    return t;
  };
  /** Pasta onde os arquivos do card moram; card sem ocasião ganha uma com o título dele. */
  async function pastaDoCard(t: Card, pessoaId: string): Promise<string> {
    if (!t.empresa_id) throw new Recusa(400, "Escolha a empresa para anexar arquivo.");
    const s = servico();
    let oc = t.ocasiao_id ? (await s.ler("ocasioes", { id: t.ocasiao_id }))[0] : undefined;
    if (oc && oc.empresa_id !== t.empresa_id) throw new Recusa(409, "A ocasião deste card é de outra empresa. Escolha uma ocasião da empresa do card.");
    if (!oc) {
      oc = await novaOcasiao(t.empresa_id, nomeOk(t.titulo) ?? "Sem título", pessoaId, true);
      await s.atualizar("tarefas", { id: t.id }, { ocasiao_id: oc.id as string });
    }
    if (!oc.drive_pasta_id) {
      const pasta = await d.api.criarPasta(String(oc.nome), await pastaEmpresa(t.empresa_id));
      await s.atualizar("ocasioes", { id: oc.id as string }, { drive_pasta_id: pasta });
      return pasta;
    }
    return oc.drive_pasta_id as string;
  }

  // ---- apagar arquivos de um card (Drive + Supabase + linhas) ----
  async function esvaziar(tarefaId: string) {
    const s = servico();
    const linhas = await s.ler<{ id: string; drive_id: string | null; caminho: string | null }>("arquivos", { tarefa_id: tarefaId }, "id,drive_id,caminho");
    // cada linha sai logo depois do seu arquivo: se algo falhar no meio, o que sobra no banco é exatamente o que ainda está no Drive (e dá para tentar de novo)
    for (const l of linhas) if (l.drive_id) { await d.api.lixeira(l.drive_id); await s.apagar("arquivos", { id: l.id }); }
    const sup = linhas.flatMap((l) => (l.caminho ? [l.caminho] : []));
    await s.removerObjetos("arquivos", sup);
    if (sup.length) await s.apagar("arquivos", { tarefa_id: tarefaId });
  }

  // ---- ações ----
  type Corpo = Record<string, unknown>;
  async function comUsuario(acao: string, c: Corpo, token: string, origem: string): Promise<unknown> {
    const pessoa = await pessoaDe(token);
    const eu = doUsuario(token);
    const tarefaId = texto(c.tarefa_id);
    const podeMexer = async (id: string) => exigir(await eu.rpc("pode_mexer_anexos", { p_tarefa: id }), 403, "Você não pode mexer nos anexos deste card.");
    switch (acao) {
      case "sessao_envio": {
        const nome = nomeOk(c.nome, 200), tipo = texto(c.tipo), papel = texto(c.papel) ?? "anexo", tamanho = Number(c.tamanho);
        const mime = texto(c.mime) ?? "application/octet-stream";
        if (!tarefaId || !nome || !tipo || !TIPOS.includes(tipo) || !(tamanho > 0 && tamanho <= MAX_BYTES) || !["anexo", "capa"].includes(papel) || (papel === "capa" && tipo !== "imagem")
          || (tipo === "imagem" && !mime.startsWith("image/")) || (tipo === "video" && !mime.startsWith("video/"))) throw new Recusa(400, "Pedido de envio inválido.");
        await podeMexer(tarefaId);
        const pasta = await pastaDoCard(await cardDe(tarefaId), pessoa.id);
        return { sessao_url: await d.api.abrirSessao(pasta, nome, mime, tamanho, origem) };
      }
      case "confirmar_envio": {
        const driveId = texto(c.drive_id), nome = nomeOk(c.nome, 200), tipo = texto(c.tipo), papel = texto(c.papel) ?? "anexo", tamanho = Number(c.tamanho), ordem = Number(c.ordem ?? 0);
        if (!tarefaId || !driveId || !nome || !tipo || !TIPOS.includes(tipo) || !(tamanho > 0) || !["anexo", "capa"].includes(papel) || !Number.isInteger(ordem)) throw new Recusa(400, "Confirmação inválida.");
        await podeMexer(tarefaId);
        const s = servico();
        const [ja] = await s.ler<{ id: string; tarefa_id: string }>("arquivos", { drive_id: driveId }, "id,tarefa_id");
        if (ja) {
          if (ja.tarefa_id !== tarefaId) throw new Recusa(409, "Este arquivo já pertence a outro card.");
          return { arquivo_id: ja.id }; // repetição do mesmo pedido
        }
        const card = await cardDe(tarefaId);
        const pasta = await pastaDoCard(card, pessoa.id);
        const f = await d.api.ver(driveId);
        // arquivo fora da pasta do card NÃO é nosso: só recusa, nunca mexe nele
        if (!f.parents?.includes(pasta) || f.mimeType === "application/vnd.google-apps.folder") throw new Recusa(422, "O arquivo não está na pasta deste card.");
        if (Number(f.size) !== tamanho) {
          await d.api.lixeira(driveId).catch(() => {}); // nesta pasta é um envio nosso que ficou pela metade
          throw new Recusa(422, "O arquivo não chegou inteiro ao Drive. Tente de novo.");
        }
        try {
          const [l] = await s.inserir<{ id: string }>("arquivos", { tarefa_id: tarefaId, drive_id: driveId, nome, tipo, tamanho, papel, ordem, criado_por: pessoa.id });
          return { arquivo_id: l.id };
        } catch (e) {
          // Perdeu a corrida contra a mesma confirmação? Então a linha existe: é o MESMO arquivo, não se apaga nada.
          const [agora] = await s.ler<{ id: string; tarefa_id: string }>("arquivos", { drive_id: driveId }, "id,tarefa_id").catch(() => []);
          if (agora) {
            if (agora.tarefa_id !== tarefaId) throw new Recusa(409, "Este arquivo já pertence a outro card.");
            return { arquivo_id: agora.id };
          }
          await d.api.lixeira(driveId).catch(() => {}); // sem linha para esse arquivo ele ficaria solto no Drive
          if (e instanceof ErroRest && e.status === 409) throw new Recusa(409, "Este card já tem capa. Tire a atual antes.");
          throw e;
        }
      }
      case "criar_ocasiao": {
        const empresa = texto(c.empresa_id), nome = nomeOk(c.nome);
        if (!empresa || !nome) throw new Recusa(400, "Escreva o nome da ocasião.");
        const visivel = await eu.ler("empresas", { id: empresa }, "id");
        if (!visivel.length) throw new Recusa(403, "Empresa não encontrada.");
        const o = await novaOcasiao(empresa, nome, pessoa.id, false);
        return { ocasiao: { id: o.id, empresa_id: o.empresa_id, nome: o.nome } };
      }
      case "renomear_ocasiao": {
        const id = texto(c.ocasiao_id), nome = nomeOk(c.nome);
        if (!id || !nome) throw new Recusa(400, "Escreva o nome da ocasião.");
        if (!(await eu.ler("ocasioes", { id }, "id")).length) throw new Recusa(404, "Ocasião não encontrada."); // a trava de leitura do banco decide se a pessoa a enxerga
        const s = servico();
        const [o] = await s.ler<{ id: string; empresa_id: string; drive_pasta_id: string | null }>("ocasioes", { id });
        if (!o) throw new Recusa(404, "Ocasião não encontrada.");
        if ((await s.ler("ocasioes", { empresa_id: o.empresa_id })).some((x) => x.id !== id && String(x.nome).trim().toLowerCase() === nome.toLowerCase())) throw new Recusa(409, "Já existe uma ocasião com esse nome.");
        if (o.drive_pasta_id) await d.api.renomear(o.drive_pasta_id, nome); // acha pelo id, não pelo nome
        await s.atualizar("ocasioes", { id }, { nome });
        return { ok: true };
      }
      case "apagar_anexo": {
        const id = texto(c.arquivo_id);
        if (!id) throw new Recusa(400, "Anexo não informado.");
        const [a] = await eu.ler<{ id: string; tarefa_id: string; drive_id: string | null }>("arquivos", { id }, "id,tarefa_id,drive_id");
        if (!a?.drive_id) throw new Recusa(404, "Anexo não encontrado.");
        await podeMexer(a.tarefa_id);
        await d.api.lixeira(a.drive_id);
        await servico().apagar("arquivos", { id });
        return { ok: true };
      }
      case "apagar_tarefa": {
        if (!tarefaId) throw new Recusa(400, "Card não informado.");
        exigir(await eu.rpc("pode_apagar_tarefa", { p_tarefa: tarefaId }), 403, "Você não pode apagar este card.");
        try { await esvaziar(tarefaId); } catch { throw new Recusa(502, "Não consegui apagar no Drive, tente de novo."); }
        // por último, com a chave do USUÁRIO: se a trava recusar, nada além dos arquivos foi mexido
        if (!(await eu.apagar("tarefas", { id: tarefaId })).length) throw new Recusa(403, "O banco não deixou apagar o card.");
        return { ok: true };
      }
      case "ordenar_anexos": {
        const lista = Array.isArray(c.ordem) ? (c.ordem as { id?: unknown; ordem?: unknown }[]) : [];
        if (!tarefaId || !lista.length || lista.length > 50 || lista.some((x) => typeof x.id !== "string" || !Number.isInteger(x.ordem))) throw new Recusa(400, "Ordem inválida.");
        await podeMexer(tarefaId);
        for (const x of lista) await servico().atualizar("arquivos", { id: x.id as string, tarefa_id: tarefaId }, { ordem: x.ordem as number }); // filtra pelo card: não mexe em arquivo de outro
        return { ok: true };
      }
      case "link_video": {
        const id = texto(c.arquivo_id);
        if (!id) throw new Recusa(400, "Vídeo não informado.");
        const [a] = await eu.ler<{ id: string; drive_id: string | null; tipo: string }>("arquivos", { id }, "id,drive_id,tipo"); // a trava de leitura decide se a pessoa vê o card
        if (!a?.drive_id || a.tipo !== "video") throw new Recusa(404, "Vídeo não encontrado.");
        const ate = agora() + 10 * 60_000;
        return { url: `${url()}/functions/v1/drive?ver=${a.id}&ate=${ate}&sig=${await assinar(await segredo(), `${a.id}.${ate}`)}` };
      }
      default:
        throw new Recusa(400, "Ação desconhecida.");
    }
  }

  async function servirVideo(req: Request): Promise<Response> {
    const q = new URL(req.url).searchParams;
    const ver = q.get("ver") ?? "", ate = Number(q.get("ate")), sig = q.get("sig") ?? "";
    if (!(ate > agora()) || !(await conferir(await segredo(), `${ver}.${ate}`, sig))) return json(403, { erro: "Link vencido." });
    const [a] = await servico().ler<{ drive_id: string | null }>("arquivos", { id: ver }, "drive_id");
    if (!a?.drive_id) return json(404, { erro: "Vídeo não encontrado." });
    const r = await d.baixar(a.drive_id, req.headers.get("range"));
    const h = new Headers(CORS);
    for (const n of ["content-type", "content-length", "content-range"]) { const v = r.headers.get(n); if (v) h.set(n, v); }
    h.set("accept-ranges", "bytes");
    h.set("cache-control", "private, max-age=600");
    return new Response(r.body, { status: r.status, headers: h });
  }

  return async function tratar(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    let acao = "?";
    try {
      if (req.method === "GET") return await servirVideo(req);
      if (req.method !== "POST") return json(405, { erro: "Método não aceito." });
      const c = (await req.json().catch(() => ({}))) as Corpo;
      acao = texto(c.acao) ?? "?";
      const campainha = req.headers.get("x-tarefas-segredo");
      if (campainha) {
        // só o alarme do banco; e só para limpar
        if (!(await iguais(campainha, await segredo())) || acao !== "limpar") throw new Recusa(401, "Não autorizado.");
        const id = texto(c.tarefa_id);
        if (!id) throw new Recusa(400, "Card não informado.");
        const t = await cardDe(id);
        if (t.etapa !== "postado") throw new Recusa(409, "O card não está em Postado.");
        try { await esvaziar(id); } catch (e) {
          await servico().rpc("armar_alarme_servico", { p_tipo: "limpar", p_tarefa: id, p_minutos: 60 }); // tenta de novo daqui a 1 h
          throw e;
        }
        return json(200, { ok: true });
      }
      const token = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "")?.[1];
      if (!token) throw new Recusa(401, "Entre no sistema.");
      return json(200, await comUsuario(acao, c, token, req.headers.get("origin") ?? ""));
    } catch (e) {
      if (e instanceof Recusa) return json(e.status, { erro: e.message });
      console.error(JSON.stringify({ funcao: "drive", acao, erro: e instanceof Error ? e.message : "?" })); // só o código; nunca corpo, chave ou endereço
      if (e instanceof ErroDrive) return json(502, { erro: "O Google Drive não respondeu como esperado. Tente de novo." });
      if (e instanceof ErroRest && (e.status === 401 || e.status === 403)) return json(403, { erro: "O banco não deixou." });
      return json(500, { erro: "Algo deu errado. Tente de novo." });
    }
  };
}
