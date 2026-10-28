"use client";
import { useId, useRef, type CSSProperties } from "react";
import type { DataImportante } from "./datas";
import { nomeMes, nomeSemana } from "./logica";

const TIPO = { feriado: "Feriado", comemorativa: "Data comemorativa", destaque: "Data em destaque" };

/** Balão de vidro das datas importantes, no lugar do title do navegador. Abre com o mouse e com o foco do teclado; fica no
    topo da tela (popover) e preso ao dia pela âncora, virando para o outro lado quando não cabe. O leitor de tela lê o mesmo
    texto pelo aria-describedby. Devolve as props do gatilho e o balão, que vai dentro do gatilho. */
export function useBalao(dia: string, datas: DataImportante[], extra?: string) {
  const id = `balao${useId().replace(/[^\w-]/g, "")}`;
  const balao = useRef<HTMLSpanElement>(null);
  const aberto = () => !!balao.current?.matches(":popover-open");
  const abrir = () => {
    if (!balao.current || aberto()) return;
    // um balão por vez: o do foco não fica aberto por baixo do que o mouse abriu
    document.querySelectorAll<HTMLElement>(".balao:popover-open").forEach((b) => b.hidePopover());
    balao.current.showPopover();
  };
  const fechar = () => { if (aberto()) balao.current!.hidePopover(); };
  const gatilho = {
    onMouseEnter: abrir, onMouseLeave: fechar, onFocus: abrir, onBlur: fechar, "aria-describedby": id,
    style: { anchorName: `--${id}` } as CSSProperties,
  };
  const elemento = (
    <span ref={balao} id={id} popover="manual" role="tooltip" className="balao" style={{ positionAnchor: `--${id}` } as CSSProperties}>
      <span className="balao-data">{`${nomeSemana(dia, "long")}, ${Number(dia.slice(8, 10))} de ${nomeMes(dia).toLowerCase()}`}</span>
      {extra && <span className="balao-extra">{extra}</span>}
      {datas.map((d) => (
        <span key={d.nome} className="balao-item" data-tipo={d.tipo}>
          <span className="balao-bolinha" aria-hidden />
          <span><span className="balao-tipo">{TIPO[d.tipo]}: </span>{d.nome}</span>
          {d.aviso && <span className="balao-aviso">{d.aviso}</span>}
        </span>
      ))}
    </span>
  );
  return { gatilho, elemento };
}
