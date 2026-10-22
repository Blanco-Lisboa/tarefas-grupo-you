// 292 · A linha do Caderno "Sem data" vai num update à parte (a função salvar_tarefa não a conhece). Antes do SQL 292 colado a coluna
// não existe: o banco responde 42703/PGRST204, a tela guarda a posição só até recarregar e nada quebra.
import { supabase } from "@/lib/supabase/cliente";

let semColuna = false;
export const colunaAusente = (e: { code?: string } | null) => e?.code === "42703" || e?.code === "PGRST204";

/** true = gravou, ou a coluna ainda não existe (sem erro para mostrar). false = o banco recusou por outro motivo. */
export async function gravarLinhaCaderno(id: string, linha: number | undefined): Promise<boolean> {
  if (semColuna) return true;
  const { error } = await supabase().from("tarefas").update({ linha_caderno: linha ?? null }).eq("id", id);
  if (!error) return true;
  if (!colunaAusente(error)) return false;
  semColuna = true;
  return true;
}
