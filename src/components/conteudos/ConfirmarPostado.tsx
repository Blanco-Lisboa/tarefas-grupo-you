"use client";

import { useEffect, useRef } from "react";
import "./confirmar-postado.css";

export function ConfirmarPostado({ titulo, aoConfirmar, aoCancelar }: {
  titulo: string;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (dialogo.current && !dialogo.current.open) dialogo.current.showModal();
  }, []);

  return (
    <dialog ref={dialogo} className="confirmar-postado" aria-labelledby="confirmar-postado-titulo" onClose={aoCancelar}>
      <h2 id="confirmar-postado-titulo">Confirmar mudança para Postado?</h2>
      <p>{titulo}</p>
      <div className="confirmar-postado-acoes">
        <button type="button" className="btn btn-2" onClick={() => dialogo.current?.close()}>Cancelar</button>
        <button type="button" className="btn" onClick={aoConfirmar}>Confirmar Postado</button>
      </div>
    </dialog>
  );
}
