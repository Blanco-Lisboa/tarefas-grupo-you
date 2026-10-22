// 292 e 296 · Linha do Caderno "Sem data" e cor da linha vão num update à parte (a função salvar_tarefa não as conhece). Antes do SQL
// colado a coluna não existe: o banco responde 42703/PGRST204, a tela guarda o valor só até recarregar e nada quebra.
import { supabase } from "@/lib/supabase/cliente";
import type { Tarefa } from "./tipos";

/** coluna -> até quando não insistir. Só 1 min: se o SQL foi colado com a aba aberta, a próxima tentativa já funciona (antes ficava preso até recarregar). */
const semColuna = new Map<string, number>();
export const ESPERA_COLUNA_MS = 60_000;
export const colunaAusente = (e: { code?: string } | null) => e?.code === "42703" || e?.code === "PGRST204";

/** Grava só o que mudou. true = gravou, ou a coluna ainda não existe (sem erro para mostrar). false = o banco recusou por outro motivo. */
export async function gravarExtras(id: string, antes: Tarefa | undefined, t: Tarefa): Promise<boolean> {
  const campos = { linha_caderno: [antes?.linhaCaderno, t.linhaCaderno], cor_linha: [antes?.corLinha, t.corLinha] } as const;
  let ok = true;
  for (const [coluna, [velho, novo]] of Object.entries(campos)) {
    if (velho === novo || (semColuna.get(coluna) ?? 0) > Date.now()) continue;
    const { data, error } = await supabase().from("tarefas").update({ [coluna]: novo ?? null }).eq("id", id).select("id");
    if (colunaAusente(error)) semColuna.set(coluna, Date.now() + ESPERA_COLUNA_MS);
    else if (error || !data?.length) ok = false; // 0 linhas sem erro = a trava (RLS) não deixou: avisa em vez de calar
  }
  return ok;
}
