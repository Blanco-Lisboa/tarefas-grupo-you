// Leitura da postagem automática (196): o que a função postar-meta gravou por card e por rede (tabela postagens, 019). Só leitura.
import type { supabase } from "@/lib/supabase/cliente";
import type { Postagem, Tarefa } from "./tipos";

/** Alguma rede na fila, enviando ou processando. */
export const postando = (t: Tarefa) => !!t.postagens?.some((p) => p.status !== "postado" && p.status !== "erro");

type LinhaPostagem = { tarefa_id: string; rede: Postagem["rede"]; status: Postagem["status"]; link: string | null; erro: string | null; postado_em: string | null };
/** Resultado da postagem automática por card. Antes do 019 a tabela não existe: segue sem nada (não derruba a carga). */
export async function carregarPostagens(sb: ReturnType<typeof supabase>): Promise<Map<string, Postagem[]>> {
  const porTarefa = new Map<string, Postagem[]>();
  const { data, error } = await sb.from("postagens").select("tarefa_id, rede, status, link, erro, postado_em");
  if (error || !data) return porTarefa;
  for (const l of data as LinhaPostagem[]) {
    porTarefa.set(l.tarefa_id, [...(porTarefa.get(l.tarefa_id) ?? []), { rede: l.rede, status: l.status, link: l.link ?? undefined, erro: l.erro ?? undefined, postadoEm: l.postado_em ?? undefined }]);
  }
  return porTarefa;
}
