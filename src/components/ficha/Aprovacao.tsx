"use client";
// Aprovação em "Em análise" (item 195), no card da Esteira. Como usar:
//
//   <SeloConserto tarefa={tarefa} />   // etiqueta vermelha "Conserto" (só aparece com tarefa.conserto)
//   <Aprovacao tarefa={tarefa} />      // linha + Aprovar/Consertar em "Em análise"; Programar postagem em "Aprovado" (para o Natham e para quem aprova o card)
//
// Aprovar leva a "Aprovado" (item 200). Lá, Programar postagem abre data e hora (postarEm); o banco (015) passa o card para "Postado" quando a hora chega.
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
  // Clicou em Programar postagem: o painel de data e hora já abre, sem um segundo clique.
  useEffect(() => { if (escolhendo) quando.current?.querySelector<HTMLButtonElement>(".campo-data-botao")?.click(); }, [escolhendo]);
  if ((tarefa.etapa !== "analise" && tarefa.etapa !== "aprovado") || !podeAprovar(tarefa, eu)) return null;

  return (
    // Sem isto, arrastar as rodas da hora (ou clicar nos botões) "pegava" o card para arrastar.
    <div className="aprovacao" onPointerDown={(e) => e.stopPropagation()}>
      {escolhendo ? (
        <div className="aprovacao-quando" ref={quando}>
          <CampoData rotulo="Data e hora do post" valor={tarefa.postarEm?.slice(0, 10) ?? ""} hora={tarefa.postarEm?.slice(11, 16) ?? ""} min={paraDia(new Date())} semLimpar vazio="Quando?"
            aoMudar={(dia, hora) => { if (dia) { setEscolhendo(false); void salvarTarefa({ ...tarefa, postarEm: `${dia}T${hora || "00:00"}` }); } }} />
          <button type="button" className="aprovacao-cancelar" onClick={() => setEscolhendo(false)}>Cancelar</button>
        </div>
      ) : tarefa.etapa === "aprovado" ? (
        <button type="button" className="aprovacao-botao" data-acao={tarefa.postarEm ? "reprogramar" : "aprovar"} onClick={() => setEscolhendo(true)}>
          {tarefa.postarEm ? "Reprogramar postagem" : "Programar postagem"}
        </button>
      ) : (
        <>
          <button type="button" className="aprovacao-botao" data-acao="aprovar" onClick={() => void salvarTarefa({ ...tarefa, etapa: "aprovado" })}>Aprovar</button>
          <button type="button" className="aprovacao-botao" data-acao="consertar" onClick={() => void salvarTarefa({ ...tarefa, etapa: "edicao", conserto: true })}>Consertar</button>
        </>
      )}
    </div>
  );
}
