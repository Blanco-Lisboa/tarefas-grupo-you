import type { ReactNode } from "react";
import "./cabecalho-coluna.css";

/** Cabeçalho de coluna da Esteira (item 253): número, título, contador em caixinha, botão + e filete de cor à esquerda.
    A cor vem de --etapa na coluna que o contém. Peça única: a Esteira e o Mural de ideias usam esta. */
export function CabecalhoColuna({ numero, titulo, total, rotuloNovo, aoNovo, extra }: { numero: number; titulo: ReactNode; total: number; rotuloNovo: string; aoNovo: () => void; extra?: ReactNode }) {
  return (
    <div className="cab-coluna">
      <span className="cab-coluna-numero">{String(numero).padStart(2, "0")}</span>
      <h2>{titulo}</h2>
      <span className="cab-coluna-contagem">{total}</span>
      {extra}
      <button className="cab-coluna-novo" type="button" aria-label={rotuloNovo} onClick={aoNovo}>+</button>
    </div>
  );
}
