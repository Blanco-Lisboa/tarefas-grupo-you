import { supabase } from "@/lib/supabase/cliente";
import { ehConteudoCard } from "./esteira";
import type { Tarefa } from "./tipos";

/** 287 (SQL 029): card de conteúdo (empresa + etapa) só se apaga pela função `apagar_card`; apagar direto na tabela o banco recusa.
    Antes de colar o 029 a função não existe (PGRST202/42883): cai no apagar direto de sempre. Tarefa comum do Caderno apaga direto. */
export async function apagarSemAnexo(alvo: Tarefa | undefined, id: string): Promise<{ data: { id: string }[] | null; error: { code?: string; message?: string } | null }> {
  const sb = supabase();
  if (alvo && ehConteudoCard(alvo)) {
    const { error } = await sb.rpc("apagar_card", { p_tarefa: id });
    if (!error) return { data: [{ id }], error: null };
    if (error.code !== "PGRST202" && error.code !== "42883") return { data: null, error };
  }
  return sb.from("tarefas").delete().eq("id", id).select("id");
}
