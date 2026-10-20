"use client";
// Aprovação em "Em análise" (item 195), no card da Esteira. Como usar:
//
//   <SeloConserto tarefa={tarefa} />   // etiqueta vermelha "Conserto" (só aparece com tarefa.conserto)
//   <Aprovacao tarefa={tarefa} />      // linha + Aprovar/Consertar (só em "Em análise", para o Natham e para quem aprova o card)
//
// Aprovar abre data e hora: o card vai para "Aprovado" com postarEm; o banco (015) o passa para "Postado" sozinho quando a hora chega.
// Consertar devolve para "Edição" com a etiqueta; o banco a apaga quando o card sai de "Edição".
import { useEffect, useRef, useState } from "react";
import { podeAlterar, salvarTarefa, useEu, type Responsavel, type Tarefa } from "@/lib/dados";
import { paraDia } from "@/components/calendario/logica";
import { CampoData } from "@/components/ui/CampoData";
import { NOMES } from "./Ficha";
import "./aprovacao.css";

/** Espelha private.pode_aprovar (015): o Natham, ou a pessoa cujo nome é o aprovador do card. */
export const podeAprovar = (t: Tarefa, eu: Responsavel | null) =>
  !!eu && podeAlterar(t, eu) && (eu === "natham" || NOMES.responsavel[eu].toLowerCase() === t.aprovador?.trim().toLowerCase());

export function SeloConserto({ tarefa }: { tarefa: Tarefa }) {
  return tarefa.conserto ? <span className="selo-conserto" role="status">Conserto</span> : null;
}

export function Aprovacao({ tarefa }: { tarefa: Tarefa }) {
  const eu = useEu();
  const [escolhendo, setEscolhendo] = useState(false);
  const quando = useRef<HTMLDivElement>(null);
  // Clicou em Aprovar: o painel de data e hora já abre, sem um segundo clique.
  useEffect(() => { if (escolhendo) quando.current?.querySelector<HTMLButtonElement>(".campo-data-botao")?.click(); }, [escolhendo]);
  if (tarefa.etapa !== "analise" || !podeAprovar(tarefa, eu)) return null;

  return (
    // Sem isto, arrastar as rodas da hora (ou clicar nos botões) "pegava" o card para arrastar.
    <div className="aprovacao" onPointerDown={(e) => e.stopPropagation()}>
      {escolhendo ? (
        <div className="aprovacao-quando" ref={quando}>
          <CampoData rotulo="Data e hora do post" valor="" hora="" min={paraDia(new Date())} semLimpar vazio="Quando?"
            aoMudar={(dia, hora) => { if (dia) void salvarTarefa({ ...tarefa, etapa: "aprovado", postarEm: `${dia}T${hora || "00:00"}` }); }} />
          <button type="button" className="aprovacao-cancelar" onClick={() => setEscolhendo(false)}>Cancelar</button>
        </div>
      ) : (
        <>
          <button type="button" className="aprovacao-botao" data-acao="aprovar" onClick={() => setEscolhendo(true)}>Aprovar</button>
          <button type="button" className="aprovacao-botao" data-acao="consertar" onClick={() => void salvarTarefa({ ...tarefa, etapa: "edicao", conserto: true })}>Consertar</button>
        </>
      )}
    </div>
  );
}
