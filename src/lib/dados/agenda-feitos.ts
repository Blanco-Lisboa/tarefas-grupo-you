// "Feito" dos compromissos do Google no Caderno (item 221). O Google é só leitura: o quadradinho vale só aqui, guardado em
// agenda_feitos (supabase/_colar/020-agenda-feitos.sql), uma linha por pessoa e compromisso. Sem a tabela, o visto some ao recarregar.
"use client";
import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase/cliente";

const NADA: ReadonlySet<string> = new Set();
let feitos = NADA;
let iniciado = false;
const ouvintes = new Set<() => void>();
const trocar = (novo: ReadonlySet<string>) => { feitos = novo; ouvintes.forEach((f) => f()); };

/** Lê do banco o que esta pessoa já marcou. Se falhar (tabela ainda não criada), mantém o que está na tela. */
async function carregar() {
  const { data, error } = await supabase().from("agenda_feitos").select("evento_id");
  if (!error) trocar(new Set((data ?? []).map((l) => l.evento_id as string)));
}

const assinar = (f: () => void) => {
  ouvintes.add(f);
  if (!iniciado && typeof window !== "undefined") {
    iniciado = true;
    void carregar();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) void carregar(); });
  }
  return () => void ouvintes.delete(f);
};

/** Ids dos compromissos que a pessoa logada marcou como feitos. */
export const useEventosFeitos = () => useSyncExternalStore(assinar, () => feitos, () => NADA);

/** Marca ou desmarca na hora; se o banco recusar, volta ao que o banco tem. */
export async function marcarEventoFeito(id: string, feito: boolean) {
  const novo = new Set(feitos);
  if (feito) novo.add(id); else novo.delete(id);
  trocar(novo);
  const tabela = supabase().from("agenda_feitos");
  const { error } = feito ? await tabela.insert({ evento_id: id }) : await tabela.delete().eq("evento_id", id);
  if (error && error.code !== "23505") void carregar(); // 23505 = já estava marcado
}
