// Tempo real (item 274): quando alguém muda uma tabela, `aoMudar` roda e a tela relê o dado, sem recarregar a página.
// Analogia: um sino na porta do banco; ele só avisa que algo mudou e a tela vai olhar de novo (quem decide o que cada um vê continua sendo a trava, RLS).
// Antes do SQL 028 colado, as tabelas não avisam e nada acontece: o resto da tela segue igual (volta à aba, intervalo etc.).
import { supabase } from "@/lib/supabase/cliente";

/** Liga um canal nas `tabelas`; várias mudanças seguidas viram uma só chamada de `aoMudar`. Devolve a função que desliga (chame ao sair da tela). */
export function ligarTempoReal(nome: string, tabelas: string[], aoMudar: () => void, espera = 300): () => void {
  if (typeof window === "undefined") return () => {};
  let atraso: ReturnType<typeof setTimeout> | undefined;
  const avisar = () => { clearTimeout(atraso); atraso = setTimeout(() => { if (!document.hidden) aoMudar(); }, espera); };
  try {
    const sb = supabase();
    const canal = tabelas.reduce((c, table) => c.on("postgres_changes", { event: "*", schema: "public", table }, avisar), sb.channel(`tempo-real:${nome}`));
    canal.subscribe(); // falha de conexão ou tabela fora da publicação: sem aviso, a tela só não recebe eventos
    return () => { clearTimeout(atraso); void sb.removeChannel(canal); };
  } catch {
    return () => {};
  }
}
