"use client";
import { useEffect, useRef, type ReactNode } from "react";

// Janela flutuante da Névoa (vidro, cantos, sombra). Usa o <dialog> do navegador: ele já fecha com Esc, prende o foco
// dentro e fica por cima de tudo. Aqui só somamos o X e o clique fora.
export function CardFlutuante({ titulo, aoFechar, voltar, children }: { titulo: string; aoFechar: () => void; voltar?: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className="card-flut"
      aria-label={titulo}
      onClose={aoFechar}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <div className="card-flut-topo">
        {voltar && (
          <button type="button" className="btn btn-2 card-flut-voltar" onClick={voltar}>
            Voltar
          </button>
        )}
        <h2>{titulo}</h2>
        <button type="button" className="card-flut-x" aria-label="Fechar" onClick={() => ref.current?.close()}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg>
        </button>
      </div>
      <div className="card-flut-corpo">{children}</div>
    </dialog>
  );
}
