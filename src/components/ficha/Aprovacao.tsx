"use client";
// Pé do card da Esteira (itens 195, 200, 196). Como usar:
//
//   <SeloConserto tarefa={tarefa} />   // etiqueta vermelha "Conserto" com a chave inglesa (só aparece com tarefa.conserto)
//   <Aprovacao tarefa={tarefa} />      // o pé do card, conforme o tipo e a etapa (abaixo)
//
// - Card que NÃO é Postagem: "Concluir" em qualquer etapa (Natham, Matheus ou o dono), que pede confirmação e APAGA o card (decisão de 23/10).
// - Postagem em "Em análise": Aprovar (vai para Aprovado) e Consertar (volta para Edição com a etiqueta).
// - Postagem em "Aprovado": UMA linha de estado (Programado · data · redes / Postando… / Erro ao postar: abra o card / Sem programação).
//   Programar, Postar agora, Tentar de novo e as redes ficam na ficha, no bloco Publicação (pedido do Natham: o card fica baixo).
// - Postagem em "Postado": nada no pé; os links do post ficam na ficha e no Mapa.
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { podeAlterar, podeApagar, removerTarefa, salvarTarefa, useEu, type Responsavel, type Tarefa } from "@/lib/dados";
import { ehQuemAprova } from "./arrumar";
import { Confirmar } from "./Confirmar";
import { estadoDoCard } from "./postagem";
import "./aprovacao.css";

export const podeAprovar = (t: Tarefa, eu: Responsavel | null) => podeAlterar(t, eu) && ehQuemAprova(t.aprovador, eu);

// Fita vermelha só com o ícone do Natham (engrenagem + chave inglesa, PNG dele em public/icones; nunca redesenhar em SVG).
export function SeloConserto({ tarefa }: { tarefa: Tarefa }) {
  return tarefa.conserto ? (
    <span className="selo-conserto" role="img" aria-label="Conserto" title="Conserto">
      {/* unoptimized: chega o original de 1080 px, e o recorte do CSS (object-view-box) conta nesses pixels */}
      <Image src="/icones/conserto-engrenagem-chave.png" alt="" width={20} height={20} unoptimized />
    </span>
  ) : null;
}

export function Aprovacao({ tarefa }: { tarefa: Tarefa }) {
  const eu = useEu();
  const [concluindo, setConcluindo] = useState(false);
  // Sem isto, clicar nos botões "pegava" o card para arrastar.
  const pe = (filhos: ReactNode, classe = "") => <div className={`aprovacao ${classe}`} onPointerDown={(e) => e.stopPropagation()}>{filhos}</div>;

  if (tarefa.tipo !== "postagem") {
    if (!podeApagar(tarefa, eu)) return null;
    return pe(<>
      <button type="button" className="aprovacao-botao" data-acao="concluir" onClick={() => setConcluindo(true)}>Concluir</button>
      {concluindo && <Confirmar titulo="Concluir e apagar este card?" texto={`"${tarefa.titulo}" sai do sistema, com os anexos. Não dá para desfazer.`} acao="Concluir" perigo
        aoCancelar={() => setConcluindo(false)} aoConfirmar={() => { setConcluindo(false); void removerTarefa(tarefa.id); }} />}
    </>);
  }
  if (tarefa.etapa === "analise") {
    return podeAprovar(tarefa, eu) ? pe(<>
      <button type="button" className="aprovacao-botao" data-acao="aprovar" onClick={() => void salvarTarefa({ ...tarefa, etapa: "aprovado" })}>Aprovar</button>
      <button type="button" className="aprovacao-botao" data-acao="consertar" onClick={() => void salvarTarefa({ ...tarefa, etapa: "edicao", conserto: true })}>Consertar</button>
    </>) : null;
  }
  if (tarefa.etapa !== "aprovado") return null;
  const estado = estadoDoCard(tarefa);
  return pe(<p className="aprovacao-situacao" data-tipo={estado.tom} role={estado.tom === "normal" ? undefined : "status"}>{estado.texto}</p>, "aprovacao-postagem");
}
