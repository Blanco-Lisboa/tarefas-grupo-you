"use client";
// Confirmação de algo que não volta atrás (Concluir que apaga, Postar agora). Esc ou Cancelar fecham sem fazer nada.
//   <Confirmar titulo="Concluir e apagar este card?" texto="Não dá para desfazer." acao="Concluir" perigo aoConfirmar={...} aoCancelar={...} />
import { useEffect, useRef } from "react";

export function Confirmar({ titulo, texto, acao, perigo, aoConfirmar, aoCancelar }: {
  titulo: string; texto: string; acao: string; perigo?: boolean; aoConfirmar: () => void; aoCancelar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (dialogo.current && !dialogo.current.open) dialogo.current.showModal(); }, []);
  return (
    // O diálogo nasce dentro do card: sem parar o clique e o arraste aqui, eles "pegavam" o card por trás.
    <dialog ref={dialogo} className="confirmar" aria-labelledby="confirmar-titulo" onClose={aoCancelar} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <h2 id="confirmar-titulo">{titulo}</h2>
      <p>{texto}</p>
      <div className="confirmar-acoes">
        <button type="button" className="btn btn-2" autoFocus onClick={() => dialogo.current?.close()}>Cancelar</button>
        <button type="button" className="btn" data-perigo={perigo} onClick={aoConfirmar}>{acao}</button>
      </div>
    </dialog>
  );
}
