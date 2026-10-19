"use client";
import { useId, type CSSProperties } from "react";
import "@/components/ui/selecao.css";
import "@/components/tarefas/caderno.css";

// ⋮ da pasta: Renomear e Excluir, com a mesma pele do menu das tarefas (popover do navegador: Esc e clique fora fecham).
export function MenuPasta({ nome, aoRenomear, aoExcluir }: { nome: string; aoRenomear: () => void; aoExcluir: () => void }) {
  const uid = useId();
  const ancora = `--menu-${uid.replace(/[^\w-]/g, "")}`;
  const id = `${uid}-menu`;
  const escolher = (f: () => void) => () => { document.getElementById(id)?.hidePopover(); f(); };
  return (
    <>
      <button type="button" className="mt-pontos gf-pontos" popoverTarget={id} style={{ anchorName: ancora } as CSSProperties} aria-label={`Mais opções: ${nome}`} title="Mais opções">
        <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="4" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="10" cy="16" r="1.6" /></svg>
      </button>
      <div id={id} popover="auto" className="selecao-pop mt-pop" style={{ positionAnchor: ancora } as CSSProperties}>
        <div className="selecao-lista mt-lista" role="group" aria-label={`Opções de ${nome}`}>
          <button type="button" className="selecao-opcao" onClick={escolher(aoRenomear)}>
            <svg className="mt-ico" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 17l1-4L14 3l3 3L7 16z" /></svg>
            <span className="selecao-opcao-rotulo">Renomear</span>
          </button>
          <button type="button" className="selecao-opcao mt-perigo" onClick={escolher(aoExcluir)}>
            <svg className="mt-ico" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6M8.5 9v4M11.5 9v4" /></svg>
            <span className="selecao-opcao-rotulo">Excluir</span>
          </button>
        </div>
      </div>
    </>
  );
}
