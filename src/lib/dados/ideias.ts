"use client";
// Ideias de conteúdo (itens 65 e 256). Moram no banco (public.ideias + public.ideias_categorias, supabase/_colar/024):
// Natham e Matheus veem e editam as mesmas, por empresa. Escrita otimista: a tela muda na hora e, se o banco recusar, volta e avisa.
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase/cliente";
import { falhou } from "./repositorio";

export type Ideia = { id: string; empresaId: string; categoria: string; titulo: string; texto: string; link?: string };
type Estado = { ideias: Ideia[]; categorias: string[] };
type Linha = { id: string; empresa_id: string; categoria: string; titulo: string; texto: string; link: string | null };

const VAZIO: Estado = { ideias: [], categorias: [] };
const CHAVE = "grade-conteudo:ideias:v1"; // onde ficavam, no navegador, antes do banco
const marca = (e: string) => `${CHAVE}:subiu:${e}`;

let estado = new Map<string, Estado>(); // troca o mapa a cada mudança (exigência do useSyncExternalStore)
let pendentes = 0; // escritas ainda não confirmadas: a leitura não pisa por cima delas
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

const daLinha = (l: Linha): Ideia => ({ id: l.id, empresaId: l.empresa_id, categoria: l.categoria, titulo: l.titulo, texto: l.texto, link: l.link ?? undefined });
const paraBanco = (i: Ideia) => ({ id: i.id, empresa_id: i.empresaId, categoria: i.categoria, titulo: i.titulo, texto: i.texto, link: i.link || null });

// ---- cópia única do navegador para o banco ------------------------------------------------------------------------------
const GANCHOS = new Set(["you-ideia-5", "you-ideia-6"]); // item 254: voltam para Ganchos ao subir
const ehUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
/** Os exemplos do código tinham ids como "you-ideia-5". No banco o id é uuid: este é derivado do nome, então o mesmo exemplo
 *  vindo de dois endereços (127.0.0.1 e vercel) ou de duas abas cai na MESMA linha. */
export const idDoExemplo = (id: string) => {
  const [e, , n = "0"] = id.split("-");
  const hex = [...e].map((c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join("").padEnd(12, "0").slice(0, 12);
  return `5eed${n.padStart(4, "0")}-0000-4000-8000-${hex}`;
};

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
    const lista = (JSON.parse(localStorage.getItem(CHAVE) || "{}") as Record<string, Ideia[]>)[e];
    if (!lista?.length) return true;
    const linhas = lista.map((i) => paraBanco({ ...i, id: ehUuid(i.id) ? i.id : idDoExemplo(i.id), empresaId: e, categoria: GANCHOS.has(i.id) ? "Ganchos" : i.categoria, texto: i.texto ?? "" }));
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
  await subirIdeiasDoNavegador(e);
  const sb = supabase();
  const [i, c] = await Promise.all([
    sb.from("ideias").select("id, empresa_id, categoria, titulo, texto, link").eq("empresa_id", e).order("seq"),
    sb.from("ideias_categorias").select("nome").eq("empresa_id", e).order("seq"),
  ]);
  if (i.error || c.error) return falhou("Não consegui carregar as ideias. Recarregue a página.");
  if (pendentes) return;
  const ideias = (i.data as Linha[]).map(daLinha);
  trocar(e, () => ({ ideias, categorias: ideias.reduce((cats, x) => com(cats, x.categoria), (c.data ?? []).map((x) => x.nome as string)) }));
}

// ---- escrita otimista ----------------------------------------------------------------------------------------------------
async function escrever(op: PromiseLike<{ error: unknown }>, desfazer: () => void, aviso: string) {
  pendentes++;
  const { error } = await op;
  pendentes--;
  if (error) { desfazer(); falhou(aviso); }
}
const colocar = (e: string, id: string, ideia: Ideia | undefined) =>
  trocar(e, (s) => ({ ...s, ideias: ideia ? (s.ideias.some((i) => i.id === id) ? s.ideias.map((i) => (i.id === id ? ideia : i)) : [...s.ideias, ideia]) : s.ideias.filter((i) => i.id !== id) }));

/** Cria (sem id) ou edita (com id existente). Devolve a ideia já na tela; o banco confirma depois. */
export function gravarIdeia(e: string, nova: Omit<Ideia, "id" | "empresaId"> & { id?: string }): Ideia {
  const ideia: Ideia = { ...nova, id: nova.id ?? crypto.randomUUID(), empresaId: e };
  const antes = (estado.get(e) ?? VAZIO).ideias.find((i) => i.id === ideia.id);
  colocar(e, ideia.id, ideia);
  trocar(e, (s) => ({ ...s, categorias: com(s.categorias, ideia.categoria) }));
  void escrever(supabase().from("ideias").upsert(paraBanco(ideia), { onConflict: "id" }), () => colocar(e, ideia.id, antes), "Não consegui salvar a ideia. Tente de novo.");
  return ideia;
}

/** Apaga uma ideia (Mural de folhas). */
export function apagarIdeia(e: string, id: string) {
  const antes = (estado.get(e) ?? VAZIO).ideias.find((i) => i.id === id);
  if (!antes) return;
  colocar(e, id, undefined);
  void escrever(supabase().from("ideias").delete().eq("id", id), () => colocar(e, id, antes), "Não consegui apagar a ideia. Tente de novo.");
}

/** Nova coluna do mural; fica guardada mesmo vazia. */
export function criarCategoria(e: string, nome: string) {
  trocar(e, (s) => ({ ...s, categorias: com(s.categorias, nome) }));
  void escrever(
    supabase().from("ideias_categorias").upsert({ empresa_id: e, nome }, { onConflict: "empresa_id,nome", ignoreDuplicates: true }),
    () => trocar(e, (s) => ({ ...s, categorias: s.categorias.filter((c) => c !== nome || s.ideias.some((i) => i.categoria === nome)) })),
    "Não consegui criar a categoria. Tente de novo.",
  );
}

/** Ideias e colunas de uma empresa (reativo). Vem do banco; antes de chegar, vazio. */
export function useIdeias(e: string) {
  const s = useSyncExternalStore(assinar, () => estado.get(e) ?? VAZIO, () => VAZIO);
  useEffect(() => { void carregarIdeias(e); }, [e]);
  const salvar = useCallback((nova: Parameters<typeof gravarIdeia>[1]) => gravarIdeia(e, nova), [e]);
  const apagar = useCallback((id: string) => apagarIdeia(e, id), [e]);
  const criar = useCallback((nome: string) => criarCategoria(e, nome), [e]);
  return { ideias: s.ideias, categorias: s.categorias, salvar, apagar, criarCategoria: criar };
}
