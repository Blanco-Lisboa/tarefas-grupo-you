"use client";
import { useEffect, useRef } from "react";
import type { EscopoPostagem } from "@/lib/dados";

// "Só este dia / este e os próximos / todos": o padrão do Google Agenda para uma postagem que se repete (editar ou apagar).
// `semDia` = motivo de a opção "Só este dia" não poder ser usada (aparece embaixo dela).
const OPCOES: { escopo: EscopoPostagem; nome: string; ajuda: string }[] = [
  { escopo: "dia", nome: "Só este dia", ajuda: "Os outros dias não mudam." },
  { escopo: "proximos", nome: "Este e os próximos", ajuda: "Os dias antes deste ficam como estão." },
  { escopo: "todos", nome: "Todos", ajuda: "A repetição inteira, do começo ao fim." },
];

export function PerguntaEscopo({ titulo, semDia, perigo, aoEscolher, aoCancelar }: {
  titulo: string; semDia?: string; perigo?: boolean; aoEscolher: (e: EscopoPostagem) => void; aoCancelar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (dialogo.current && !dialogo.current.open) dialogo.current.showModal(); }, []);
  return (
    <dialog ref={dialogo} className="pescopo" aria-labelledby="pescopo-titulo" onCancel={(e) => e.stopPropagation()}
      onClose={(e) => { e.stopPropagation(); aoCancelar(); }} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <h2 id="pescopo-titulo">{titulo}</h2>
      <p>Esta postagem se repete. Vale para qual parte?</p>
      <div className="pescopo-lista">
        {OPCOES.map((o) => (
          <button key={o.escopo} type="button" className="pescopo-opcao" data-perigo={perigo && o.escopo === "todos" ? true : undefined}
            disabled={o.escopo === "dia" && !!semDia} onClick={() => aoEscolher(o.escopo)}>
            <b>{o.nome}</b>
            <span>{o.escopo === "dia" && semDia ? semDia : o.ajuda}</span>
          </button>
        ))}
      </div>
      <div className="pescopo-acoes"><button type="button" className="btn btn-2" autoFocus onClick={() => dialogo.current?.close()}>Cancelar</button></div>
    </dialog>
  );
}
