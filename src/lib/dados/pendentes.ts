"use client";
// Cards que esperam um vídeo novo (marca do 027, ver subindo.ts), com o "desde quando" (ISO). UMA consulta por tela: o estado mora aqui fora, e todos os
// cards e a ficha só leem dele. Relê ao abrir, ao voltar à aba e quando um envio muda de estado (vários pedidos juntos viram um só).
import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase/cliente";
import { useEnvios } from "./envios";

const VAZIO: ReadonlyMap<string, string> = new Map();
let mapa: ReadonlyMap<string, string> = VAZIO;
let agendado: ReturnType<typeof setTimeout> | undefined;
const ouvintes = new Set<() => void>();
export const consultasFeitas = { n: 0 }; // só para o teste conferir "uma consulta"

async function ler() {
  consultasFeitas.n++;
  let novo: ReadonlyMap<string, string> = VAZIO;
  try {
    const { data, error } = await supabase().from("tarefas").select("id, video_pendente_desde").not("video_pendente_desde", "is", null);
    if (!error) novo = new Map((data ?? []).map((x: { id: string; video_pendente_desde: string }) => [x.id, x.video_pendente_desde]));
  } catch { /* coluna ainda não colada (027): ninguém pendente */ }
  const igual = novo.size === mapa.size && [...novo].every(([id, d]) => mapa.get(id) === d);
  if (!igual) { mapa = novo; ouvintes.forEach((f) => f()); }
}

/** Pede uma releitura; pedidos no mesmo instante (um por card) viram uma consulta só. */
export function reler() {
  clearTimeout(agendado);
  agendado = setTimeout(() => void ler(), 50);
}

const assinar = (f: () => void) => { ouvintes.add(f); return () => void ouvintes.delete(f); };

/** Cards com vídeo novo pendente: id -> desde quando (ISO). Coluna ainda não colada (027) = vazio. */
export function usePendentes(): ReadonlyMap<string, string> {
  const estados = useEnvios().map((e) => e.estado).join();
  useEffect(() => {
    const volta = () => { if (!document.hidden) reler(); };
    document.addEventListener("visibilitychange", volta);
    return () => { document.removeEventListener("visibilitychange", volta); };
  }, []);
  useEffect(() => { reler(); }, [estados]);
  return useSyncExternalStore(assinar, () => mapa, () => VAZIO);
}

/** "há 5 min", "há 3 h", "há 2 dias" (para a ficha dizer há quanto tempo o vídeo novo não chega). */
export function haQuanto(desde: string, agora = Date.now()): string {
  const min = Math.max(0, Math.round((agora - new Date(desde).getTime()) / 60_000));
  if (min < 60) return `há ${Math.max(1, min)} min`;
  if (min < 24 * 60) return `há ${Math.floor(min / 60)} h`;
  const d = Math.floor(min / (24 * 60));
  return `há ${d} ${d === 1 ? "dia" : "dias"}`;
}
