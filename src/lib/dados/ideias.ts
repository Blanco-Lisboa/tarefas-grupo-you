"use client";
// Ideias de conteúdo (itens 65 e 256). Moram no banco (public.ideias + public.ideias_categorias, supabase/_colar/024):
// Natham e Matheus veem e editam as mesmas, por empresa. Escrita otimista: a tela muda na hora e, se o banco recusar, volta e avisa.
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase/cliente";
import { falhou } from "./repositorio";

export type Ideia = { id: string; empresaId: string; categoria: string; titulo: string; texto: string; links: string[] };
type Estado = { ideias: Ideia[]; categorias: string[] };
type Linha = { id: string; empresa_id: string; categoria: string; titulo: string; texto: string; link: string | null; links?: string[] | null };

const VAZIO: Estado = { ideias: [], categorias: [] };
const CHAVE = "grade-conteudo:ideias:v1"; // onde ficavam, no navegador, antes do banco
const marca = (e: string) => `${CHAVE}:subiu:${e}`;

let estado = new Map<string, Estado>(); // troca o mapa a cada mudança (exigência do useSyncExternalStore)
const pendentes = new Map<string, number>(); // por empresa: escritas ainda não confirmadas; a leitura daquela empresa não pisa por cima delas
const versoes = new Map<string, number>(); // por ideia: nº da última gravação; uma falha antiga só desfaz se ainda for a última
const ouvintes = new Set<() => void>();
let iniciado = false;
const assinar = (f: () => void) => {
  ouvintes.add(f);
  if (!iniciado && typeof window !== "undefined") {
    iniciado = true;
    document.addEventListener("visibilitychange", () => { if (!document.hidden) [...estado.keys()].forEach((e) => void carregarIdeias(e)); });
  }
  return () => void ouvintes.delete(f);
};
const trocar = (e: string, f: (s: Estado) => Estado) => { estado = new Map(estado).set(e, f(estado.get(e) ?? VAZIO)); ouvintes.forEach((o) => o()); };
const com = (cats: string[], c: string) => (cats.includes(c) ? cats : [...cats, c]);

// Item 257: várias referências por ideia. Antes do 025 (coluna "links") só existe o link único; o código serve aos dois casos,
// para o mural nunca quebrar no meio da colagem. A coluna "link" continua sendo o 1º da lista (cópia para quem ainda lê só ela).
let comLista = true; // o banco já tem a coluna "links"? (descoberto a cada leitura)
const daLinha = (l: Linha): Ideia => ({ id: l.id, empresaId: l.empresa_id, categoria: l.categoria, titulo: l.titulo, texto: l.texto, links: l.links?.length ? l.links : l.link ? [l.link] : [] });
const paraBanco = (i: Omit<Ideia, "links"> & { links?: string[]; link?: string }) => {
  const links = i.links ?? (i.link ? [i.link] : []);
  return { id: i.id, empresa_id: i.empresaId, categoria: i.categoria, titulo: i.titulo, texto: i.texto, link: links[0] ?? null, ...(comLista && { links }) };
};

// ---- cópia única do navegador para o banco ------------------------------------------------------------------------------
const ehUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
/** Os exemplos do código tinham ids como "you-ideia-5" (ou o uuid derivado "5eed...", da cópia anterior). Eles já estão no banco:
 *  não sobem de novo, senão um exemplo apagado voltaria por outro endereço. */
const ehExemplo = (id: string) => !ehUuid(id) || id.startsWith("5eed");

const subidas = new Map<string, Promise<boolean>>();
/** Uma vez por abertura e empresa: o que esta pessoa tinha guardado no navegador sobe para o banco sem pisar no que já está lá
 *  (ignora o que já existe pelo id). Só depois do banco confirmar é que a marca "subiu" é gravada; os dados antigos ficam
 *  no navegador como cópia de segurança, mas nunca mais são lidos. */
export function subirIdeiasDoNavegador(e: string): Promise<boolean> {
  let p = subidas.get(e);
  if (!p) subidas.set(e, (p = subir(e).then((ok) => (ok || subidas.delete(e), ok))));
  return p;
}
async function subir(e: string): Promise<boolean> {
  try {
    if (localStorage.getItem(marca(e))) return true;
    const lista = (JSON.parse(localStorage.getItem(CHAVE) || "{}") as Record<string, (Omit<Ideia, "links"> & { links?: string[]; link?: string })[]>)[e];
    if (!lista?.length) return true;
    const linhas = lista.filter((i) => !ehExemplo(i.id)).map((i) => paraBanco({ ...i, empresaId: e, texto: i.texto ?? "" }));
    if (!linhas.length) { localStorage.setItem(marca(e), "1"); return true; }
    const cats = [...new Set(linhas.map((l) => l.categoria))].map((nome) => ({ empresa_id: e, nome }));
    const sb = supabase();
    // categorias antes: uma ideia nunca fica numa coluna que não existe. Linhas na ordem original = cards na mesma ordem.
    const a = await sb.from("ideias_categorias").upsert(cats, { onConflict: "empresa_id,nome", ignoreDuplicates: true });
    if (a.error) return false;
    const b = await sb.from("ideias").upsert(linhas, { onConflict: "id", ignoreDuplicates: true });
    if (b.error) return false;
    localStorage.setItem(marca(e), "1");
    return true;
  } catch {
    return false;
  }
}

// ---- leitura -------------------------------------------------------------------------------------------------------------
export async function carregarIdeias(e: string) {
  const copiou = await subirIdeiasDoNavegador(e);
  const sb = supabase();
  const ler = (cols: string) => sb.from("ideias").select(cols).eq("empresa_id", e).order("seq");
  const [i0, c] = await Promise.all([ler("id, empresa_id, categoria, titulo, texto, link, links"), sb.from("ideias_categorias").select("nome").eq("empresa_id", e).order("seq")]);
  let i = i0;
  comLista = !i.error;
  if (i.error) i = await ler("id, empresa_id, categoria, titulo, texto, link"); // ainda sem a coluna "links": lê o link único
  if (i.error || c.error) return falhou("Não consegui carregar as ideias. Recarregue a página.");
  if (!copiou) falhou("Não consegui copiar as ideias que estavam só neste navegador. Elas continuam guardadas; tento de novo na próxima abertura.");
  if (pendentes.get(e)) return;
  const ideias = (i.data as unknown as Linha[]).map(daLinha);
  trocar(e, () => ({ ideias, categorias: ideias.reduce((cats, x) => com(cats, x.categoria), (c.data ?? []).map((x) => x.nome as string)) }));
}

// ---- escrita otimista ----------------------------------------------------------------------------------------------------
async function escrever(e: string, op: PromiseLike<{ error: unknown }>, desfazer: () => void, aviso: string) {
  pendentes.set(e, (pendentes.get(e) ?? 0) + 1);
  const { error } = await op;
  pendentes.set(e, pendentes.get(e)! - 1);
  if (error) { desfazer(); falhou(aviso); }
}
const versao = (id: string) => { const v = (versoes.get(id) ?? 0) + 1; versoes.set(id, v); return v; };
const colocar = (e: string, id: string, ideia: Ideia | undefined) =>
  trocar(e, (s) => ({ ...s, ideias: ideia ? (s.ideias.some((i) => i.id === id) ? s.ideias.map((i) => (i.id === id ? ideia : i)) : [...s.ideias, ideia]) : s.ideias.filter((i) => i.id !== id) }));

/** Cria (sem id) ou edita (com id existente). Devolve a ideia já na tela; o banco confirma depois. */
export function gravarIdeia(e: string, nova: Omit<Ideia, "id" | "empresaId"> & { id?: string }): Ideia {
  const ideia: Ideia = { ...nova, id: nova.id ?? crypto.randomUUID(), empresaId: e };
  const antes = (estado.get(e) ?? VAZIO).ideias.find((i) => i.id === ideia.id);
  const v = versao(ideia.id);
  colocar(e, ideia.id, ideia);
  trocar(e, (s) => ({ ...s, categorias: com(s.categorias, ideia.categoria) }));
  void escrever(e, supabase().from("ideias").upsert(paraBanco(ideia), { onConflict: "id" }), () => versoes.get(ideia.id) === v && colocar(e, ideia.id, antes), "Não consegui salvar a ideia. Tente de novo.");
  return ideia;
}

/** Apaga uma ideia (Mural de folhas). */
export function apagarIdeia(e: string, id: string) {
  const antes = (estado.get(e) ?? VAZIO).ideias.find((i) => i.id === id);
  if (!antes) return;
  const v = versao(id);
  colocar(e, id, undefined);
  void escrever(e, supabase().from("ideias").delete().eq("id", id), () => versoes.get(id) === v && colocar(e, id, antes), "Não consegui apagar a ideia. Tente de novo.");
}

/** Nova coluna do mural; fica guardada mesmo vazia. */
export function criarCategoria(e: string, nome: string) {
  trocar(e, (s) => ({ ...s, categorias: com(s.categorias, nome) }));
  void escrever(
    e,
    supabase().from("ideias_categorias").upsert({ empresa_id: e, nome }, { onConflict: "empresa_id,nome", ignoreDuplicates: true }),
    () => trocar(e, (s) => ({ ...s, categorias: s.categorias.filter((c) => c !== nome || s.ideias.some((i) => i.categoria === nome)) })),
    "Não consegui criar a categoria. Tente de novo.",
  );
}

export const ideiasDe = (e: string) => estado.get(e) ?? VAZIO;

/** Ideias e colunas de uma empresa (reativo). Vem do banco; antes de chegar, vazio. */
export function useIdeias(e: string) {
  const s = useSyncExternalStore(assinar, () => ideiasDe(e), () => VAZIO);
  useEffect(() => { void carregarIdeias(e); }, [e]);
  const salvar = useCallback((nova: Parameters<typeof gravarIdeia>[1]) => gravarIdeia(e, nova), [e]);
  const apagar = useCallback((id: string) => apagarIdeia(e, id), [e]);
  const criar = useCallback((nome: string) => criarCategoria(e, nome), [e]);
  return { ideias: s.ideias, categorias: s.categorias, salvar, apagar, criarCategoria: criar };
}
