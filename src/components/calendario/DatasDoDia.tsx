"use client";
import { useBalao } from "./Balao";
import { datasDoDia } from "./datas";

/** Etiqueta do feriado ou data comemorativa no topo do dia (Dia, Semana e Mês). Mais de uma data: a primeira e "+N".
    O balão abre com o mouse na etiqueta e com o foco do teclado: no do botão do dia, quando ela está dentro de um (cabeçalho
    da semana das Tarefas), ou nela mesma, que vira focável. */
export function DatasDoDia({ dia }: { dia: string }) {
  const lista = datasDoDia(dia);
  const { gatilho, elemento } = useBalao(dia, lista);
  if (!lista.length) return null;
  const { onFocus, onBlur, "aria-describedby": descrito, ...mouse } = gatilho;
  const ligar = (el: HTMLSpanElement | null) => {
    const botao = el?.parentElement?.closest("button");
    if (!el) return;
    if (!botao) { el.tabIndex = 0; el.setAttribute("aria-describedby", descrito); return; }
    botao.setAttribute("aria-describedby", descrito);
    botao.addEventListener("focus", onFocus);
    botao.addEventListener("blur", onBlur);
    return () => { botao.removeEventListener("focus", onFocus); botao.removeEventListener("blur", onBlur); botao.removeAttribute("aria-describedby"); };
  };
  return (
    <span ref={ligar} className="data-imp" data-tipo={lista[0].tipo} onFocus={onFocus} onBlur={onBlur} {...mouse}>
      <span className="data-imp-nome">{lista[0].nome}</span>
      {lista.length > 1 && <span className="data-imp-mais">+{lista.length - 1}</span>}
      {elemento}
    </span>
  );
}
