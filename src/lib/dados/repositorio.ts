// Repositório no Supabase (Etapa 1 da fase login). A API pública (index.ts) é a mesma de antes; só este arquivo fala com o banco.
// O app fala com o banco COM a sessão de quem está logado: quem decide o que cada pessoa vê são as travas (RLS) do banco.
// Escrita otimista: a tela muda na hora; se o banco recusar, volta ao que era e mostra o aviso (ver lerErro).
import { supabase } from "@/lib/supabase/cliente";
import type { Empresa, Fazendo, NovaTarefa, Responsavel, Tag, Tarefa } from "./tipos";

type LinhaTarefa = {
  id: string; titulo: string; tipo: Tarefa["tipo"]; empresa_id: string | null; rede: Tarefa["rede"] | null; etapa: Tarefa["etapa"] | null;
  responsavel_id: string; inicio: string | null; fim: string | null; dia_inteiro: boolean; cor: Tarefa["cor"]; concluida: boolean;
  objetivo: string | null; notas: string | null; links: Tarefa["links"]; aprovador: string | null;
  dono_id: string; criado_por: string; enviada_por: string | null; vai_pro_google?: boolean;
  tarefa_tags?: { tag_id: string }[];
};
type Pessoa = { id: string; slug: Responsavel; user_id: string | null };

let tarefas: Tarefa[] = [];
let empresas: Empresa[] = [];
let tags: Tag[] = [];
let pessoas: Pessoa[] = [];
let fazendo: Record<string, Fazendo> = {};
let eu: Responsavel | null = null;
let erro = "";
let iniciado: Promise<void> | undefined;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());

// Snapshots imutáveis: cada escrita troca o array (exigência do useSyncExternalStore).
export const lerTarefas = () => tarefas;
export const lerEmpresas = () => empresas;
export const lerTags = () => tags;
export const lerFazendo = () => fazendo;
export const lerEu = () => eu;
export const lerErro = () => erro;
export const limparErro = () => { erro = ""; avisar(); };
export const assinar = (f: () => void) => {
  ouvintes.add(f);
  iniciar();
  return () => void ouvintes.delete(f);
};

const falhou = (mensagem: string) => { erro = mensagem; avisar(); };
const idDe = (slug: Responsavel) => pessoas.find((p) => p.slug === slug)?.id;
const slugDe = (id: string | null) => pessoas.find((p) => p.id === id)?.slug;

type LinhaFazendo = { pessoa_id: string; tarefa_id: string; desde: string };
/** Cada pessoa tem no máximo uma tarefa: tira a linha antiga de `quem` e, se `tarefaId`, põe a nova (começar outra troca sozinho). Se duas pessoas estão na mesma tarefa, o mapa guarda a que começou por último. */
export function trocarFazendo(mapa: Record<string, Fazendo>, quem: Responsavel, tarefaId: string | null, desde = new Date().toISOString()): Record<string, Fazendo> {
  const resto = Object.fromEntries(Object.entries(mapa).filter(([, f]) => f.quem !== quem));
  return tarefaId ? { ...resto, [tarefaId]: { quem, desde } } : resto;
}
const doBanco = (ls: LinhaFazendo[]) =>
  ls.toSorted((a, b) => a.desde.localeCompare(b.desde)).reduce((m, l) => { const q = slugDe(l.pessoa_id); return q ? trocarFazendo(m, q, l.tarefa_id, l.desde) : m; }, {} as Record<string, Fazendo>);

/** Linha do banco -> Tarefa da tela. Os anexos ainda não vão ao banco (Etapa 2): `arquivos` vem do que já está na tela. */
export function daLinha(l: LinhaTarefa, arquivos: Tarefa["arquivos"] = [], quem: (id: string | null) => Responsavel | undefined = slugDe): Tarefa {
  const ids = l.tarefa_tags?.map((x) => x.tag_id);
  return {
    id: l.id, titulo: l.titulo, tipo: l.tipo, empresaId: l.empresa_id ?? "", rede: l.rede ?? undefined, etapa: l.etapa ?? undefined,
    responsavel: quem(l.responsavel_id) ?? "natham", inicio: l.inicio ?? undefined, fim: l.fim ?? undefined, diaInteiro: l.dia_inteiro,
    cor: l.cor, concluida: l.concluida || undefined, objetivo: l.objetivo ?? undefined, notas: l.notas ?? undefined,
    links: l.links ?? [], arquivos, tags: ids?.length ? ids : undefined, aprovador: l.aprovador ?? undefined,
    dono: quem(l.dono_id), criadoPor: quem(l.criado_por), enviadaPor: quem(l.enviada_por), vaiProGoogle: l.vai_pro_google || undefined,
  };
}

/** Campos que a pessoa pode mudar depois de criada (dono, criado_por e enviada_por o banco não deixa mudar). */
export const paraBanco = (t: Tarefa, responsavelId: string | undefined) => ({
  titulo: t.titulo, tipo: t.tipo, empresa_id: t.empresaId || null, rede: t.rede ?? null, etapa: t.etapa ?? null,
  responsavel_id: responsavelId, inicio: t.inicio ?? null, fim: t.fim ?? null, dia_inteiro: t.diaInteiro, cor: t.cor,
  concluida: !!t.concluida, objetivo: t.objetivo ?? null, notas: t.notas ?? null, links: t.links, aprovador: t.aprovador ?? null,
});

/** Espelha as travas do banco (009). Tarefa ENVIADA: só quem enviou altera; quem recebeu só lê. Não enviada: o dono, ou qualquer um se for conteúdo com empresa. */
export const podeAlterar = (t: Tarefa, eu: Responsavel | null) =>
  !!eu && (t.enviadaPor ? t.enviadaPor === eu : t.dono === eu || (!!t.etapa && !!t.empresaId));
/** Quem pode APAGAR: enviada = quem enviou; não enviada = o dono (conteúdo com empresa de outro dono não apaga). */
export const podeApagar = (t: Tarefa, eu: Responsavel | null) => !!eu && (t.enviadaPor ?? t.dono) === eu;

function iniciar() {
  if (typeof window === "undefined" || iniciado) return;
  iniciado = carregar();
  // Voltou para a aba: busca de novo, para ver o que o outro mexeu enquanto isso.
  document.addEventListener("visibilitychange", () => { if (!document.hidden) void carregar(); });
}

async function carregar() {
  const sb = supabase();
  const [p, e, t, g, f, sessao] = await Promise.all([
    sb.from("pessoas").select("id, slug, user_id"),
    sb.from("empresas").select("id, nome, sigla").order("ordem").order("nome"),
    sb.from("tarefas").select("*, tarefa_tags(tag_id)").order("created_at"),
    sb.from("tags").select("id, nome, cor, aprovacao").order("nome"),
    sb.from("fazendo_agora").select("pessoa_id, tarefa_id, desde"),
    sb.auth.getClaims(),
  ]);
  const problema = p.error ?? e.error ?? t.error ?? g.error ?? f.error;
  if (problema) return falhou("Não consegui carregar os dados. Recarregue a página.");
  pessoas = p.data as Pessoa[];
  eu = pessoas.find((x) => x.user_id === sessao.data?.claims.sub)?.slug ?? null;
  if (!eu) falhou("Seu login ainda não está ligado a uma pessoa. Fale com o Natham.");
  const anexos = new Map(tarefas.map((x) => [x.id, x.arquivos]));
  empresas = e.data as Empresa[];
  tags = (g.data as Tag[]).map((x) => ({ id: x.id, nome: x.nome, cor: x.cor, ...(x.aprovacao && { aprovacao: true as const }) }));
  tarefas = (t.data as LinhaTarefa[]).map((l) => daLinha(l, anexos.get(l.id)));
  fazendo = doBanco(f.data as LinhaFazendo[]);
  avisar();
}

const soLeitura = "Essa tarefa é só para olhar: você não pode mexer nela.";
const semAcesso = "O banco não deixou salvar (sem permissão ou o item não existe mais).";

/** A função public.salvar_tarefa só existe depois do 007. PGRST202 = a API não a encontrou (42883 = o Postgres não a achou). */
let semSalvarTarefa = false;
export const funcaoAusente = (e: { code?: string } | null) => e?.code === "PGRST202" || e?.code === "42883";

export async function salvarTarefa(nova: NovaTarefa): Promise<Tarefa> {
  const id = nova.id ?? crypto.randomUUID();
  const antes = tarefas.find((t) => t.id === id);
  const dono = antes?.dono ?? nova.enviarPara ?? eu ?? undefined;
  const { enviarPara: _enviarPara, ...resto } = nova;
  void _enviarPara;
  const tarefa: Tarefa = { ...resto, id, dono, criadoPor: antes?.criadoPor ?? eu ?? undefined, enviadaPor: antes ? antes.enviadaPor : dono !== eu ? eu ?? undefined : undefined };
  if (!eu || !dono) { falhou("Seu login ainda não está ligado a uma pessoa. Fale com o Natham."); return tarefa; }
  if (antes && !podeAlterar(antes, eu)) { falhou(soLeitura); return antes; } // trava na origem: nenhuma tela mexe em tarefa só de leitura
  tarefas = antes ? tarefas.map((t) => (t.id === id ? tarefa : t)) : [...tarefas, tarefa];
  avisar();
  try {
    const sb = supabase();
    const campos = paraBanco(tarefa, idDe(tarefa.responsavel));
    const linha = { id, ...campos, responsavel_id: campos.responsavel_id ?? null, dono_id: idDe(dono), criado_por: idDe(eu), enviada_por: dono !== eu ? idDe(eu) : null,
      // só vai quando é verdade: antes do 010 a coluna não existe e mandar `false` derrubaria o salvar de toda tarefa do Caderno
      ...(tarefa.vaiProGoogle ? { vai_pro_google: true } : {}) };
    // Caminho novo: tarefa e tags numa só chamada (007). Se a função ainda não existe no banco, segue pelo caminho antigo.
    let gravada = false;
    if (!semSalvarTarefa) {
      const { error } = await sb.rpc("salvar_tarefa", { p: linha, p_tags: tarefa.tags ?? [] });
      if (!error) gravada = true;
      else if (funcaoAusente(error)) semSalvarTarefa = true;
      else throw error;
    }
    if (!gravada) {
      if (antes) {
        const { data, error } = await sb.from("tarefas").update(campos).eq("id", id).select("id");
        if (error) throw error;
        if (!data?.length) throw new Error(semAcesso);
      } else {
        const { error } = await sb.from("tarefas").insert(linha);
        if (error) throw error;
      }
      const a = (antes?.tags ?? []).join(), b = (tarefa.tags ?? []).join();
      if (a !== b) {
        if (antes) { const { error } = await sb.from("tarefa_tags").delete().eq("tarefa_id", id); if (error) throw error; }
        if (tarefa.tags?.length) { const { error } = await sb.from("tarefa_tags").insert(tarefa.tags.map((tag_id) => ({ tarefa_id: id, tag_id }))); if (error) throw error; }
      }
    }
  } catch (e) {
    tarefas = antes ? tarefas.map((t) => (t.id === id ? antes : t)) : tarefas.filter((t) => t.id !== id);
    falhou(e instanceof Error && e.message === semAcesso ? e.message : "Não consegui salvar a tarefa. Tente de novo.");
  }
  return tarefa;
}

export async function removerTarefa(id: string): Promise<void> {
  const alvo = tarefas.find((t) => t.id === id);
  if (alvo && !podeApagar(alvo, eu)) return falhou(soLeitura);
  const antes = tarefas;
  tarefas = tarefas.filter((t) => t.id !== id);
  avisar();
  const { data, error } = await supabase().from("tarefas").delete().eq("id", id).select("id");
  if (error || !data?.length) {
    tarefas = antes;
    falhou(error ? "Não consegui apagar a tarefa. Tente de novo." : semAcesso);
  }
}

export async function salvarEmpresa(empresa: Empresa): Promise<Empresa> {
  const antes = empresas;
  const nova = !empresas.some((e) => e.id === empresa.id);
  empresas = nova ? [...empresas, empresa] : empresas.map((e) => (e.id === empresa.id ? empresa : e));
  avisar();
  const ordem = nova ? { ordem: empresas.length } : {};
  const { error } = await supabase().from("empresas").upsert({ id: empresa.id, nome: empresa.nome, sigla: empresa.sigla, ...ordem });
  if (error) { empresas = antes; avisar(); throw new Error("Não consegui salvar a empresa."); }
  return empresa;
}

export async function salvarTag(nova: Omit<Tag, "id">): Promise<Tag> {
  const tag = { ...nova, id: crypto.randomUUID() };
  tags = [...tags, tag];
  avisar();
  const { error } = await supabase().from("tags").insert({ id: tag.id, nome: tag.nome, cor: tag.cor, aprovacao: !!tag.aprovacao });
  if (error) { tags = tags.filter((t) => t.id !== tag.id); falhou("Não consegui criar a tag. Tente de novo."); }
  return tag;
}

/** Marca a tarefa em que `eu` está agora (troca a anterior, se houver). Otimista; volta se o banco recusar. */
export async function comecar(tarefaId: string): Promise<void> {
  if (!eu) return falhou("Seu login ainda não está ligado a uma pessoa. Fale com o Natham.");
  const t = tarefas.find((x) => x.id === tarefaId);
  if (!t || !podeAlterar(t, eu)) return falhou("Você só pode marcar tarefa que pode editar.");
  const antes = fazendo;
  fazendo = trocarFazendo(fazendo, eu, tarefaId);
  avisar();
  const { error } = await supabase().from("fazendo_agora").upsert({ pessoa_id: idDe(eu), tarefa_id: tarefaId, desde: fazendo[tarefaId].desde });
  if (error) { fazendo = antes; falhou("Não consegui marcar a tarefa. Tente de novo."); }
}

/** Tira o selo de `eu`. */
export async function parar(): Promise<void> {
  if (!eu) return;
  const antes = fazendo;
  fazendo = trocarFazendo(fazendo, eu, null);
  avisar();
  const { error } = await supabase().from("fazendo_agora").delete().eq("pessoa_id", idDe(eu));
  if (error) { fazendo = antes; falhou("Não consegui tirar a marca. Tente de novo."); }
}
