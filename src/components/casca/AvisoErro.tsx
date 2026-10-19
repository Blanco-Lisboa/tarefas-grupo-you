"use client";
import { limparErro, useErroDados } from "@/lib/dados";

// Faixa de aviso quando o banco recusa ou falha. A tela já voltou ao que era; isto só explica o porquê.
export function AvisoErro() {
  const erro = useErroDados();
  if (!erro) return null;
  return (
    <div className="aviso-erro" role="alert">
      <span>{erro}</span>
      <button type="button" className="aviso-erro-fechar" onClick={limparErro} aria-label="Fechar aviso">×</button>
    </div>
  );
}
