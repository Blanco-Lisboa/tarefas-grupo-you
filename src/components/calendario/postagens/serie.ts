// Lê a SÉRIE inteira de uma postagem planejada (dias da semana, começo, fim) para a ficha poder editar "todos" sem perder o que o bloco do
// calendário não traz. O bloco só leva o dia daquela ocorrência.
// ponytail: leitura direta da tabela (a trava de leitura do banco deixa os logados lerem). Pedido ao Maestro: mover para src/lib/dados/postagens-planejadas.ts.
import { supabase } from "@/lib/supabase/cliente";
import type { Formato, Planejada, RedePost, Repete, Responsavel } from "@/lib/dados";

type Linha = { id: string; empresa_id: string; formato: Formato; redes: RedePost[]; hora: string; titulo: string | null; repete: Repete; data: string | null; dias_semana: number[] | null; inicio: string | null; fim: string | null; pessoas: { slug: Responsavel } | null };

export async function lerSerie(id: string): Promise<Planejada | null> {
  const { data, error } = await supabase().from("postagens_planejadas").select("*, pessoas:responsavel_id(slug)").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const l = data as Linha;
  return {
    id: l.id, empresaId: l.empresa_id, formato: l.formato, redes: l.redes, hora: l.hora.slice(0, 5), titulo: l.titulo ?? "", responsavel: l.pessoas?.slug ?? "matheus",
    repete: l.repete, data: l.data ?? undefined, diasSemana: l.dias_semana ?? [], inicio: l.inicio ?? undefined, fim: l.fim ?? undefined,
  };
}
