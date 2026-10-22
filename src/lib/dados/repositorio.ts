// Repositório no Supabase (Etapa 1 da fase login). A API pública (index.ts) é a mesma de antes; só este arquivo fala com o banco.
// O app fala com o banco COM a sessão de quem está logado: quem decide o que cada pessoa vê são as travas (RLS) do banco.
// Escrita otimista: a tela muda na hora; se o banco recusar, volta ao que era e mostra o aviso (ver lerErro).
import { supabase } from "@/lib/supabase/cliente";
import { carregarAnexos, ErroAnexo, sincronizarAnexos } from "./anexos";
import { apagarTarefaComArquivos } from "./drive";
import { ligarTempoReal } from "./tempo-real";
import { campoConsertoTexto, fecharAprovada } from "./esteira";
import { carregarPostagens, postando, postarEmQueVale, redesQueValem } from "./postagens";
import type { Empresa, Fazendo, NovaTarefa, Postagem, Responsavel, Tag, Tarefa } from "./tipos";

type LinhaTarefa = {
  id: string; titulo: string; tipo: Tarefa["tipo"]; empresa_id: string | null; rede: Tarefa["rede"] | null; etapa: Tarefa["etapa"] | null;
  responsavel_id: string; inicio: string | null; fim: string | null; dia_inteiro: boolean; cor: Tarefa["cor"]; concluida: boolean;
  objetivo: string | null; notas: string | null; links: Tarefa["links"]; aprovador: string | null;
  dono_id: string; criado_por: string; enviada_por: string | null; vai_pro_google?: boolean; postar_em?: string | null; conserto?: boolean; conserto_texto?: string | null; formato?: Tarefa["formato"] | null;
  postado_em?: string | null; legenda?: string | null; postar_redes?: Tarefa["postarRedes"] | null; capa_quadro_ms?: number | null; ocasiao_id?: string | null;
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
let desligarTempoReal: (() => void) | undefined;
export const assinar = (f: () => void) => {
  ouvintes.add(f);
  iniciar();
  // 274 · Tempo real: enquanto houver tela olhando, o banco avisa quando algo muda. Última tela sai = desliga.
  desligarTempoReal ??= ligarTempoReal("esteira", ["tarefas", "tarefa_tags", "tags", "empresas", "fazendo_agora", "arquivos", "postagens"], () => void carregar());
  return () => { ouvintes.delete(f); if (!ouvintes.size) { desligarTempoReal?.(); desligarTempoReal = undefined; } };
};

export const falhou = (mensagem: string) => { erro = mensagem; avisar(); };
/** Relê as tarefas e anexos do banco (o envio em segundo plano usa ao terminar). */
export const recarregarTarefas = () => carregar();
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

/** Linha do banco -> Tarefa da tela. `arquivos` vem da tabela arquivos (ver carregarAnexos); `postagens`, da tabela postagens (019). */
export function daLinha(l: LinhaTarefa, arquivos: Tarefa["arquivos"] = [], quem: (id: string | null) => Responsavel | undefined = slugDe, postagens?: Postagem[]): Tarefa {
  const ids = l.tarefa_tags?.map((x) => x.tag_id);
  return {
    id: l.id, titulo: l.titulo, tipo: l.tipo, empresaId: l.empresa_id ?? "", rede: l.rede ?? undefined, etapa: l.etapa ?? undefined,
    responsavel: quem(l.responsavel_id) ?? "natham", inicio: l.inicio ?? undefined, fim: l.fim ?? undefined, diaInteiro: l.dia_inteiro,
    cor: l.cor, concluida: l.concluida || undefined, objetivo: l.objetivo ?? undefined, notas: l.notas ?? undefined,
    links: l.links ?? [], arquivos, tags: ids?.length ? ids : undefined, aprovador: l.aprovador ?? undefined,
    dono: quem(l.dono_id), criadoPor: quem(l.criado_por), enviadaPor: quem(l.enviada_por), vaiProGoogle: l.vai_pro_google || undefined,
    postarEm: l.postar_em ?? undefined, postadoEm: l.postado_em ?? undefined, conserto: l.conserto || undefined, consertoTexto: l.conserto_texto === undefined ? undefined : l.conserto_texto ?? "", formato: l.formato ?? undefined,
    legenda: l.legenda ?? undefined, postarRedes: l.postar_redes ?? undefined, capaQuadroMs: l.capa_quadro_ms ?? undefined, ocasiaoId: l.ocasiao_id ?? undefined,
    postagens: postagens?.length ? postagens : undefined,
  };
}

/** 238 · O que vai em `ocasiao_id` ao salvar. Com tema: manda. SEM tema mas o card tinha um: manda null (a ficha tirou o Tema, ou mudou de empresa).
    Nunca teve tema: nem manda (a coluna só existe depois do 019). */
export const campoOcasiao = (atual: string | undefined, antes: string | undefined): { ocasiao_id?: string | null } =>
  atual ? { ocasiao_id: atual } : antes ? { ocasiao_id: null } : {};
/** 238 · Quando o card entrou em Postado, do jeito que o gatilho do banco grava: entrar agora = agora; já estava Postado = mantém; saiu = nada.
    Assim o prazo dos 7 dias mostra a data real logo depois de arrastar, sem esperar recarregar. */
export const postadoEmDe = (antes: { etapa?: string; postadoEm?: string } | undefined, etapa: string | undefined, agora = new Date()): string | undefined =>
  etapa !== "postado" ? undefined : antes?.etapa === "postado" && antes.postadoEm ? antes.postadoEm : agora.toISOString();

/** Campos que a pessoa pode mudar depois de criada (dono, criado_por e enviada_por o banco não deixa mudar). */
export const paraBanco = (t: Tarefa, responsavelId: string | undefined) => ({
  titulo: t.titulo, tipo: t.tipo, empresa_id: t.empresaId || null, rede: t.rede ?? null, etapa: t.etapa ?? null,
  responsavel_id: responsavelId, inicio: t.inicio ?? null, fim: t.fim ?? null, dia_inteiro: t.diaInteiro, cor: t.cor,
  concluida: !!t.concluida, objetivo: t.objetivo ?? null, notas: t.notas ?? null, links: t.links, aprovador: t.aprovador ?? null,
});

/** Espelha as travas do banco (009). Tarefa ENVIADA: só quem enviou altera; quem recebeu só lê. Não enviada: o dono, ou qualquer um se for conteúdo com empresa. */
export const podeAlterar = (t: Tarefa, eu: Responsavel | null) =>
  !!eu && (t.enviadaPor ? t.enviadaPor === eu : t.dono === eu || (!!t.etapa && !!t.empresaId));
/** Quem pode APAGAR (019): enviada = quem enviou; não enviada = o dono; e conteúdo com empresa, também o Natham e o Matheus (lixeira e Concluir). */
export const podeApagar = (t: Tarefa, eu: Responsavel | null) =>
  !!eu && ((t.enviadaPor ?? t.dono) === eu || (!!t.etapa && !!t.empresaId && (eu === "natham" || eu === "matheus")));

function iniciar() {
  if (typeof window === "undefined" || iniciado) return;
  iniciado = carregar();
  // Voltou para a aba: busca de novo, para ver o que o outro mexeu enquanto isso.
  document.addEventListener("visibilitychange", () => { if (!document.hidden) void carregar(); });
}

const daTag = (x: Tag): Tag => ({ id: x.id, nome: x.nome, cor: x.cor, ...(x.aprovacao && { aprovacao: true as const }) });

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
  const [anexos, postagens] = await Promise.all([carregarAnexos(sb), carregarPostagens(sb)]);
  empresas = e.data as Empresa[];
  tags = (g.data as Tag[]).map(daTag);
  tarefas = (t.data as LinhaTarefa[]).map((l) => daLinha(l, anexos.get(l.id) ?? tarefas.find((x) => x.id === l.id)?.arquivos.filter((a) => a.pendente), slugDe, postagens.get(l.id)))
    .map((x) => (cancelados.has(x.id) && !x.postarEm ? { ...x, programacaoCancelada: true } : x));
  fazendo = doBanco(f.data as LinhaFazendo[]);
  avisar();
  // Postando (196): a função grava o resultado no servidor; enquanto algum card posta, olha de novo a cada 15 s (só leitura, só com a aba aberta).
  clearTimeout(espiando);
  if (tarefas.some(postando) || Date.now() < espiarAte) espiar();
}

let espiando: ReturnType<typeof setTimeout> | undefined;
const cancelados = new Set<string>(); // cards cuja programação o salvar desta sessão tirou (ver salvarTarefa)
let espiarAte = 0; // depois de mandar postar, a função pode levar alguns segundos para registrar: olha por 2 min mesmo sem linha nova
const espiar = () => { clearTimeout(espiando); espiando = setTimeout(() => { if (!document.hidden) void carregar(); }, 15_000); };

const soLeitura = "Essa tarefa é só para olhar: você não pode mexer nela.";
const semAcesso = "O banco não deixou salvar (sem permissão ou o item não existe mais).";
/** Recusas do banco que a pessoa entende (015/019): quem aprova, e Aprovado/Postado só para Postagem. */
export function motivoDoBanco(e: unknown, padrao: string) {
  const { code, message } = (e ?? {}) as { code?: string; message?: string };
  if (code === "42501") return "Só o Natham ou quem aprova o card pode fazer isso.";
  if (code === "23514" && message?.includes("Postagem")) return "Só card de Postagem vai para Aprovado e Postado. Para terminar, use Concluir.";
  return e instanceof Error && e.message === semAcesso ? e.message : padrao;
}

/** A função public.salvar_tarefa só existe depois do 007. PGRST202 = a API não a encontrou (42883 = o Postgres não a achou). */
let semSalvarTarefa = false;
export const funcaoAusente = (e: { code?: string } | null) => e?.code === "PGRST202" || e?.code === "42883";

/** Devolve a tarefa gravada, ou null se o banco recusou (nada mudou). Gravada com anexo que não subiu: devolve a tarefa e o aviso
    (lerErro) diz que "a tarefa foi salva, mas..." (Lupa 215 v2: quem chama trata como salva). */
export async function salvarTarefa(nova: NovaTarefa): Promise<Tarefa | null> {
  const id = nova.id ?? crypto.randomUUID();
  const antes = tarefas.find((t) => t.id === id);
  const dono = antes?.dono ?? nova.enviarPara ?? eu ?? undefined;
  const { enviarPara: _enviarPara, ...resto } = nova;
  void _enviarPara;
  // O gatilho do 015 faz o mesmo no banco: Conserto só em Edição, data do post só em Aprovado/Postado.
  const tarefa: Tarefa = { ...resto, ...fecharAprovada(resto, tags), conserto: resto.etapa === "edicao" && resto.conserto ? true : undefined,
    postarEm: postarEmQueVale({ ...resto, postarRedes: redesQueValem(resto) }), postarRedes: redesQueValem(resto), programacaoCancelada: undefined, id, dono, criadoPor: antes?.criadoPor ?? eu ?? undefined, enviadaPor: antes ? antes.enviadaPor : dono !== eu ? eu ?? undefined : undefined };
  tarefa.postadoEm = postadoEmDe(antes, tarefa.etapa); // 238: a data real de entrada em Postado (o banco grava a mesma)
  // Havia data e o salvar a tirou (só Facebook + vídeo): a tela avisa "Programação cancelada" até alguém programar de novo.
  if (antes?.postarEm && !tarefa.postarEm && tarefa.etapa === "aprovado") { cancelados.add(id); tarefa.programacaoCancelada = true; }
  if (tarefa.postarEm) cancelados.delete(id);
  if (!eu || !dono) { falhou("Seu login ainda não está ligado a uma pessoa. Fale com o Natham."); return null; }
  if (antes && !podeAlterar(antes, eu)) { falhou(soLeitura); return null; } // trava na origem: nenhuma tela mexe em tarefa só de leitura
  tarefas = antes ? tarefas.map((t) => (t.id === id ? tarefa : t)) : [...tarefas, tarefa];
  avisar();
  try {
    const sb = supabase();
    const campos = paraBanco(tarefa, idDe(tarefa.responsavel));
    const linha = { id, ...campos, postar_em: tarefa.postarEm ?? null, conserto: !!tarefa.conserto, formato: tarefa.formato ?? null, responsavel_id: campos.responsavel_id ?? null, dono_id: idDe(dono), criado_por: idDe(eu), enviada_por: dono !== eu ? idDe(eu) : null,
      legenda: tarefa.legenda?.trim() || null, postar_redes: tarefa.postarRedes ?? null, capa_quadro_ms: tarefa.capaQuadroMs ?? null,
      // 238: Tema escolhido vai; Tema TIRADO (tinha e agora não tem) vai como null; nunca teve, nem vai (ver campoOcasiao)
      ...campoOcasiao(tarefa.ocasiaoId, antes?.ocasiaoId), ...campoConsertoTexto(tarefa.consertoTexto, antes?.consertoTexto),
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
    falhou(motivoDoBanco(e, "Não consegui salvar a tarefa. Tente de novo."));
    return null;
  }
  // A tarefa já está no banco (o anexo precisa dela). Se o anexo falhar, a tarefa fica e o aviso diz que o anexo não subiu.
  try {
    const arquivos = await sincronizarAnexos(supabase(), id, tarefa.empresaId, eu && idDe(eu), antes?.arquivos ?? [], tarefa.arquivos);
    tarefa.arquivos = arquivos;
    tarefas = tarefas.map((t) => (t.id === id ? { ...t, arquivos } : t));
    avisar();
  } catch (e) {
    falhou(e instanceof ErroAnexo ? `A tarefa foi salva, mas ${e.message}` : "A tarefa foi salva, mas não consegui guardar os anexos. Abra a ficha e anexe de novo.");
  }
  return tarefa;
}

export async function removerTarefa(id: string): Promise<void> {
  const alvo = tarefas.find((t) => t.id === id);
  if (alvo && !podeApagar(alvo, eu)) return falhou(soLeitura);
  const antes = tarefas;
  tarefas = tarefas.filter((t) => t.id !== id);
  avisar();
  // Card com anexo guardado só sai pela função drive (019): ela tira os arquivos do Drive e do Storage antes, para nada ficar órfão.
  if (alvo?.arquivos.some((a) => !a.pendente)) {
    try { await apagarTarefaComArquivos(id); } catch (e) {
      tarefas = antes;
      falhou(e instanceof Error && e.message ? e.message : "Não consegui apagar a tarefa. Tente de novo.");
    }
    return;
  }
  const { data, error } = await supabase().from("tarefas").delete().eq("id", id).select("id");
  if (error || !data?.length) {
    tarefas = antes;
    falhou(error ? motivoDoBanco(error, "Não consegui apagar a tarefa. Tente de novo.") : semAcesso);
  }
}

/** "Postar agora" (196): só Natham/aprovador, card de Postagem em Aprovado; o banco marca a hora e chama a função. */
export async function postarAgora(id: string): Promise<void> {
  const { error } = await supabase().rpc("postar_agora", { p_tarefa: id });
  if (error) return falhou(motivoDoBanco(error, "Não consegui mandar postar. Tente de novo."));
  // Mostra "Postando…" na hora (a rede que já saiu fica como está); a próxima carga traz o que a função gravou.
  tarefas = tarefas.map((t) => (t.id === id ? { ...t, postagens: (t.postarRedes ?? ["instagram", "facebook"]).map((rede) => t.postagens?.find((p) => p.rede === rede && p.status === "postado") ?? { rede, status: "fila" as const }) } : t));
  avisar();
  espiarAte = Date.now() + 120_000;
  espiar();
}

/** "Tentar de novo" (196): volta para a fila só as redes que deram erro (a que já saiu não repete). */
export async function tentarDeNovo(id: string): Promise<void> {
  const { error } = await supabase().rpc("tentar_de_novo", { p_tarefa: id });
  if (error) return falhou(motivoDoBanco(error, "Não consegui tentar de novo. Tente outra vez."));
  tarefas = tarefas.map((t) => (t.id === id ? { ...t, postagens: t.postagens?.map((p) => (p.status === "erro" ? { ...p, status: "fila" as const, erro: undefined } : p)) } : t));
  avisar();
  espiarAte = Date.now() + 120_000;
  espiar();
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

/** 242 · Nome e cor de uma tag (pela lista de Tags da ficha). Otimista; volta se o banco recusar. A tag do sistema (aprovacao) não muda. */
export async function editarTag(id: string, mudou: Pick<Tag, "nome" | "cor">): Promise<void> {
  const antes = tags.find((t) => t.id === id);
  if (!antes || antes.aprovacao) return;
  tags = tags.map((t) => (t.id === id ? { ...t, ...mudou } : t));
  avisar();
  const { error } = await supabase().from("tags").update({ nome: mudou.nome, cor: mudou.cor }).eq("id", id);
  if (error) { tags = tags.map((t) => (t.id === id ? antes : t)); falhou("Não consegui mudar a tag. Tente de novo."); }
}

/** 242 · Apaga a tag; o banco a tira de todos os cards sozinho (tarefa_tags com on delete cascade).
    243: NÃO é otimista: a tag só sai da tela (e dos rascunhos, que filtram ao salvar) DEPOIS que o banco confirma. true = apagou. */
export async function excluirTag(id: string): Promise<boolean> {
  const antes = tags.find((t) => t.id === id);
  if (!antes || antes.aprovacao) return false;
  const { error } = await supabase().from("tags").delete().eq("id", id);
  if (error) { falhou("Não consegui excluir a tag. Tente de novo."); return false; }
  tags = tags.filter((t) => t.id !== id);
  tarefas = tarefas.map((t) => {
    if (!t.tags?.includes(id)) return t;
    const resto = t.tags.filter((x) => x !== id);
    return { ...t, tags: resto.length ? resto : undefined };
  });
  avisar();
  return true;
}

/** 243 · Quantos cards usam a tag, contando TODOS (inclusive os que só o dono vê): public.contar_cards_da_tag (022). null = a função falhou
    (antes do 022 colado, ou sem rede): quem chama cai na contagem dos cards que a pessoa vê. */
export async function contarCardsDaTag(id: string): Promise<number | null> {
  const { data, error } = await supabase().rpc("contar_cards_da_tag", { p_tag: id });
  return !error && typeof data === "number" ? data : null;
}

/** 243 · Lê as tags de novo do banco e devolve os ids que existem. A ficha chama antes de salvar: outra pessoa pode ter excluído
    uma tag marcada no rascunho, e o id apagado faria o salvar inteiro falhar (chave estrangeira em tarefa_tags). Falhou a leitura: fica a lista atual. */
export async function recarregarTags(): Promise<string[]> {
  const { data, error } = await supabase().from("tags").select("id, nome, cor, aprovacao").order("nome");
  if (!error && data) { tags = (data as Tag[]).map(daTag); avisar(); }
  return tags.map((t) => t.id);
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
