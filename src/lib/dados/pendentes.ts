"use client";
// Cards que esperam um vídeo novo (marca do 027, ver subindo.ts). Relê o banco ao abrir, ao voltar à aba e quando um envio muda de estado.
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/cliente";
import { useEnvios } from "./envios";

const VAZIO: ReadonlySet<string> = new Set();
const RELER = "grade:pendentes";
/** Pede a todas as telas que releiam a marca (depois de "Postar com o vídeo atual"). */
export const reler = () => window.dispatchEvent(new Event(RELER));

/** Ids dos cards com vídeo novo pendente. Coluna ainda não colada (027) = ninguém. */
export function usePendentes(): ReadonlySet<string> {
  const [ids, setIds] = useState<ReadonlySet<string>>(VAZIO);
  const estados = useEnvios().map((e) => e.estado).join();
  useEffect(() => {
    let vivo = true;
    const ler = async () => {
      try {
        const { data, error } = await supabase().from("tarefas").select("id").not("video_pendente_desde", "is", null);
        if (vivo) setIds(error ? VAZIO : new Set((data ?? []).map((x: { id: string }) => x.id)));
      } catch { if (vivo) setIds(VAZIO); }
    };
    void ler();
    const volta = () => { if (!document.hidden) void ler(); };
    document.addEventListener("visibilitychange", volta);
    window.addEventListener(RELER, volta);
    return () => { vivo = false; document.removeEventListener("visibilitychange", volta); window.removeEventListener(RELER, volta); };
  }, [estados]);
  return ids;
}
