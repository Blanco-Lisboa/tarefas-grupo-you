"use client";
// Pé do card da Esteira (itens 195, 200, 196). Como usar:
//
//   <SeloConserto tarefa={tarefa} />   // etiqueta vermelha "Conserto" com a chave inglesa (com tarefa.conserto ou com texto no campo Conserto)
//   <Aprovacao tarefa={tarefa} />      // o pé do card, conforme o tipo e a etapa (abaixo)
//
// - Card que NÃO é Postagem: "Concluir" em qualquer etapa (Natham, Matheus ou o dono), que pede confirmação e APAGA o card (decisão de 23/10).
// - Postagem em "Em análise": nada no pé; Consertar e Aprovar ficam no fim da ficha (itens 208 e 219, pedido do Natham).
// - Postagem em "Aprovado": UMA linha de estado (Programado · data · redes / Postando… / Erro ao postar: abra o card / Sem programação).
//   Com a postagem automática desligada (238), "Programado" e "programação" viram "Hora marcada".
//   Programar, Postar agora, Tentar de novo e as redes ficam na ficha, no bloco Publicação (pedido do Natham: o card fica baixo).
// - Postagem em "Postado": nada no pé; os links do post ficam na ficha e no Mapa.
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { podeAlterar, podeApagar, removerTarefa, useEu, usePendentes, usePostagemAutomatica, type Responsavel, type Tarefa } from "@/lib/dados";
import { ehQuemAprova } from "./arrumar";
import { Confirmar } from "./Confirmar";
import { comoHoraMarcada, estadoDoCard } from "./postagem";
import "./aprovacao.css";

export const podeAprovar = (t: Tarefa, eu: Responsavel | null) => podeAlterar(t, eu) && ehQuemAprova(t.aprovador, eu);

// Fita vermelha só com o ícone do Natham (engrenagem + chave inglesa, PNG dele em public/icones; nunca redesenhar em SVG).
export function SeloConserto({ tarefa }: { tarefa: Tarefa }) {
  return tarefa.conserto || tarefa.consertoTexto ? ( // 271: com texto no campo Conserto também mostra
    <span className="selo-conserto" role="img" aria-label="Conserto" title={tarefa.consertoTexto || "Conserto"}>
      {/* unoptimized: chega o original de 1080 px, e o recorte do CSS (object-view-box) conta nesses pixels */}
      <Image src="/icones/conserto-engrenagem-chave.png" alt="" width={20} height={20} unoptimized />
    </span>
  ) : null;
}

export function Aprovacao({ tarefa }: { tarefa: Tarefa }) {
  const eu = useEu();
  const { ligada } = usePostagemAutomatica();
  const [concluindo, setConcluindo] = useState(false);
  const semVideoNovo = usePendentes().has(tarefa.id);
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
  if (tarefa.etapa !== "aprovado") return null;
  const estado = estadoDoCard(tarefa);
  return pe(<>{semVideoNovo && <p className="aprovacao-situacao" data-tipo="erro" role="alert">Vídeo novo não subiu: postagem bloqueada</p>}<p className="aprovacao-situacao" data-tipo={estado.tom} role={estado.tom === "normal" ? undefined : "status"}>{comoHoraMarcada(estado.texto, ligada)}</p></>, "aprovacao-postagem");
}
