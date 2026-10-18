// Tarefas riscadas no caderno. A Tarefa ainda não tem campo "feita": guardamos só os ids, neste navegador.
"use client";
import { useCallback, useSyncExternalStore } from "react";

const CHAVE = "grade:tarefas-feitas";
const VAZIO: readonly string[] = [];
let ids: readonly string[] = VAZIO;
let carregado = false;
const ouvintes = new Set<() => void>();

function carregar() {
  if (carregado || typeof window === "undefined") return;
  carregado = true;
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
    if (Array.isArray(salvo)) ids = salvo.filter((x): x is string => typeof x === "string");
  } catch {}
}
const assinar = (f: () => void) => (ouvintes.add(f), () => void ouvintes.delete(f));
const ler = () => (carregar(), ids);

export function useFeitas() {
  const feitas = useSyncExternalStore(assinar, ler, () => VAZIO);
  const alternar = useCallback((id: string) => {
    ids = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    try { localStorage.setItem(CHAVE, JSON.stringify(ids)); } catch {}
    ouvintes.forEach((f) => f());
  }, []);
  return { feitas, alternar };
}
