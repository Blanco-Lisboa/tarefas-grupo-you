// Marca no BANCO de "vídeo legendado ainda subindo" (Lupa re-revisão 1, achado 5; SQL 027, passo 8). Enquanto vale, o banco não deixa
// "Postar agora", "Tentar de novo" nem o alarme da hora marcada postarem o vídeo antigo (qualquer aba, qualquer pessoa).
// Antes de colar o 027 as funções não existem: os erros são engolidos e o app segue como antes (a trava só da aba da ficha continua valendo).
import { supabase } from "@/lib/supabase/cliente";

const RENOVA_EM_MS = 5 * 60_000; // o banco vence a marca em 15 min; renovar a cada 5 mantém enquanto o envio vive
const emEnvio = new Map<string, { n: number; relogio: ReturnType<typeof setInterval> }>();

const marcar = (tarefaId: string, subindo: boolean) => void Promise.resolve(supabase().rpc("marcar_video_subindo", { p_tarefa: tarefaId, p_subindo: subindo })).catch(() => {});

/** Começa a segurar a postagem do card (vários vídeos do mesmo card contam juntos). Devolve a função que solta; a marca só sai quando o último soltar. */
export function segurarPostagem(tarefaId: string): () => void {
  const atual = emEnvio.get(tarefaId);
  if (atual) atual.n++;
  else { marcar(tarefaId, true); emEnvio.set(tarefaId, { n: 1, relogio: setInterval(() => marcar(tarefaId, true), RENOVA_EM_MS) }); }
  let solto = false;
  return () => {
    const e = emEnvio.get(tarefaId);
    if (solto || !e) return;
    solto = true;
    if (--e.n > 0) return;
    clearInterval(e.relogio);
    emEnvio.delete(tarefaId);
    marcar(tarefaId, false);
  };
}

/** O banco diz que há vídeo subindo neste card? Erro (função ainda não colada) conta como "não". */
export const videoSubindo = async (tarefaId: string): Promise<boolean> => {
  try { const { data } = await supabase().rpc("video_subindo", { p_tarefa: tarefaId }); return data === true; } catch { return false; }
};
