"use client";
// Pastas de cada empresa (item 135). Sem banco ainda (Fase 2 = Supabase): as pastas de fábrica + o que o Natham criar,
// renomear ou excluir ficam no navegador (localStorage). Só este arquivo troca na Fase 2.
import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Peca, TipoPeca } from "./pecas";

/** tipo = guarda as peças daquele tipo; sem tipo = pasta criada à mão, nasce vazia. vazio = aviso quando não tem peça e não aceita nenhuma. */
export type Pasta = { id: string; nome: string; tipo?: TipoPeca; vazio?: string };

const CHAVE = "grade-conteudo:pastas:v1";
const POST: Pasta = { id: "post", nome: "Posts", tipo: "post" };
const CARROSSEL: Pasta = { id: "carrossel", nome: "Carrosséis", tipo: "carrossel" };
const VIDEO: Pasta = { id: "video", nome: "Vídeos", tipo: "video" };
const STORY: Pasta = { id: "story", nome: "Stories", tipo: "story" };
// "Adrian - Aprovar" é só da You e começa vazia: ainda não há onde guardar o que espera a aprovação.
const ADRIAN: Pasta = { id: "adrian", nome: "Adrian - Aprovar", tipo: "video", vazio: "Nenhum vídeo esperando o Adrian aprovar." };

const semente = (empresaId: string): Pasta[] => (empresaId === "you" ? [POST, CARROSSEL, VIDEO, ADRIAN, STORY] : [POST, CARROSSEL, VIDEO, STORY]);

type Mapa = Record<string, Pasta[]>;
let memoria = ""; // se o navegador negar o armazenamento, vale até recarregar
const ouvintes = new Set<() => void>();
const assinar = (f: () => void) => (ouvintes.add(f), () => void ouvintes.delete(f));
const bruto = () => {
  try {
    return memoria || (localStorage.getItem(CHAVE) ?? "");
  } catch {
    return memoria;
  }
};
const ler = (txt: string): Mapa => {
  try {
    return txt ? (JSON.parse(txt) as Mapa) : {};
  } catch {
    return {};
  }
};

function gravar(empresaId: string, mudar: (lista: Pasta[]) => Pasta[]) {
  const todas = ler(bruto());
  todas[empresaId] = mudar(todas[empresaId] ?? semente(empresaId));
  memoria = JSON.stringify(todas);
  try {
    localStorage.setItem(CHAVE, memoria);
  } catch {
    /* sem armazenamento: fica na memória */
  }
  ouvintes.forEach((f) => f());
}

export const lerPastas = (empresaId: string): Pasta[] => ler(bruto())[empresaId] ?? semente(empresaId);

/** Peças guardadas numa pasta: as que foram postas nela, ou (peças de exemplo) as do tipo dela. A pasta com aviso `vazio` só tem o que foi posto nela. */
export const pecasDaPasta = (pecas: Peca[], pasta: Pasta) => pecas.filter((p) => (p.pastaId ? p.pastaId === pasta.id : !pasta.vazio && !!pasta.tipo && p.tipo === pasta.tipo));

/** Já existe outra pasta com esse nome na empresa? (ignora maiúsculas e a própria pasta em `exceto`) */
export const nomeEmUso = (pastas: Pasta[], nome: string, exceto?: string) => pastas.some((p) => p.id !== exceto && p.nome.trim().toLowerCase() === nome.trim().toLowerCase());

export const criarPasta = (empresaId: string, nome: string) => gravar(empresaId, (l) => [...l, { id: crypto.randomUUID(), nome: nome.trim() }]);
export const renomearPasta = (empresaId: string, id: string, nome: string) => gravar(empresaId, (l) => l.map((p) => (p.id === id ? { ...p, nome: nome.trim() } : p)));
/** Quem chama confere antes se a pasta tem peças: aqui só tira da lista. */
export const excluirPasta = (empresaId: string, id: string) => gravar(empresaId, (l) => l.filter((p) => p.id !== id));

/** Pastas de uma empresa (reativo). Sem nada guardado, mostra as de fábrica. */
export function usePastas(empresaId: string) {
  const txt = useSyncExternalStore(assinar, bruto, () => "");
  const pastas = useMemo(() => ler(txt)[empresaId] ?? semente(empresaId), [txt, empresaId]);
  return {
    pastas,
    criar: useCallback((nome: string) => criarPasta(empresaId, nome), [empresaId]),
    renomear: useCallback((id: string, nome: string) => renomearPasta(empresaId, id, nome), [empresaId]),
    excluir: useCallback((id: string) => excluirPasta(empresaId, id), [empresaId]),
  };
}
