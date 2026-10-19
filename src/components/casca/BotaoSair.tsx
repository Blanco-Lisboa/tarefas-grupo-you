"use client";
import { supabase } from "@/lib/supabase/cliente";

// Encerra a sessão e recarrega na tela de entrar (a memória da pessoa anterior não fica).
export function BotaoSair() {
  async function sair() {
    await supabase().auth.signOut();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa de propósito: limpa a memória da sessão anterior
    window.location.href = "/entrar";
  }
  return (
    <button type="button" className="menu-item" onClick={sair} title="Sair">
      <svg className="menu-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M14 4.5h3.5a2 2 0 012 2v11a2 2 0 01-2 2H14M10 8l-4 4 4 4M6 12h9" />
      </svg>
      <span className="menu-rotulo">Sair</span>
    </button>
  );
}
