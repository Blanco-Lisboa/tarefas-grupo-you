// Filtro GLOBAL de empresa. Lista vazia = Todas. Lembrado entre telas e entre visitas (localStorage).
// A interface (botões) mora em src/components/casca/FiltroEmpresa.tsx; as telas só usam useFiltroEmpresa().
"use client";
import { useCallback, useSyncExternalStore } from "react";

const CHAVE = "grade:filtro-empresa";
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

function definir(novos: readonly string[]) {
  ids = novos.length ? novos : VAZIO;
  try { localStorage.setItem(CHAVE, JSON.stringify(ids)); } catch {}
  ouvintes.forEach((f) => f());
}

const assinar = (f: () => void) => (ouvintes.add(f), () => void ouvintes.delete(f));
const ler = () => (carregar(), ids);

export function useFiltroEmpresa() {
  const selecionadas = useSyncExternalStore(assinar, ler, () => VAZIO);
  const alternar = useCallback((id: string) => definir(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]), []);
  const limpar = useCallback(() => definir(VAZIO), []);
  /** Aplica o filtro a qualquer lista que tenha empresaId (tarefas, pastas, etc.). */
  const aplicar = useCallback(
    <T extends { empresaId: string }>(lista: readonly T[]): T[] =>
      selecionadas.length ? lista.filter((x) => selecionadas.includes(x.empresaId)) : [...lista],
    [selecionadas],
  );
  return { selecionadas, todas: selecionadas.length === 0, alternar, limpar, aplicar };
}
