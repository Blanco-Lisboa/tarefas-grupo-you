"use client";
import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import "./selecao.css";

// Botão de seleção (item 42): clica, abre a lista, escolhe uma ou várias opções. Peça ÚNICA do sistema:
// toda tela que filtra ou escolhe entre opções usa este componente, ninguém faz o seu próprio.
// Desenho do modelo 1 Névoa (item 60): botão em vidro branco; a lista é um painel de vidro que flutua.
// A lista abre por cima de tudo (popover do navegador: fecha com Esc ou clique fora) e se prende ao botão (anchor).
export type Opcao = { valor: string; rotulo: string; antes?: ReactNode };

type Props = {
  rotulo: string;
  opcoes: readonly Opcao[];
  valor: readonly string[];
  aoMudar: (novo: string[]) => void;
  /** Várias opções ao mesmo tempo (padrão). Com false, escolher fecha a lista. */
  multipla?: boolean;
  /** Primeira linha que limpa a escolha, ex.: "Todas". Sem ela, a lista só tem as opções. */
  rotuloTodos?: string;
  /** Com escolha, o botão fechado mostra o rótulo e, colado na seta, só o ícone/logo da escolha; o nome fica no title e no aria-label (itens 106 e 108). */
  soIcone?: boolean;
};

export function Selecao({ rotulo, opcoes, valor, aoMudar, multipla = true, rotuloTodos, soIcone }: Props) {
  const id = useId();
  const lista = useRef<HTMLDivElement>(null);
  const ancora = `--selecao-${id.replace(/[^\w-]/g, "")}`;
  const escolhidas = opcoes.filter((o) => valor.includes(o.valor));
  const icone = !!soIcone && escolhidas.length > 0 && escolhidas.every((o) => o.antes);

  const escolher = (v: string | null) => {
    if (v === null) aoMudar([]);
    else if (multipla) aoMudar(valor.includes(v) ? valor.filter((x) => x !== v) : [...valor, v]);
    else aoMudar(valor.includes(v) && rotuloTodos ? [] : [v]);
    if (!multipla) lista.current?.hidePopover();
  };

  return (
    <>
      <button
        type="button"
        className="selecao-botao"
        popoverTarget={`${id}-lista`}
        data-escolhido={escolhidas.length > 0}
        aria-label={icone ? `${rotulo}: ${escolhidas.map((o) => o.rotulo).join(", ")}` : undefined}
        title={escolhidas.length ? `${rotulo}: ${escolhidas.map((o) => o.rotulo).join(", ")}` : undefined}
        style={{ anchorName: ancora } as CSSProperties}
      >
        {multipla || !escolhidas.length ? <span>{rotulo}</span> : <span className="selecao-rotulo-p">{rotulo}</span>}
        {escolhidas.length > 0 &&
          (icone ? (
            escolhidas.slice(0, 3).map((o) => <span key={o.valor} className="selecao-antes selecao-antes-fim">{o.antes}</span>)
          ) : multipla ? (
            <>
              {escolhidas.slice(0, 3).map((o) => o.antes && <span key={o.valor} className="selecao-antes">{o.antes}</span>)}
              <span className="selecao-contador" aria-label={`${escolhidas.length} escolhida${escolhidas.length > 1 ? "s" : ""}`}>
                {escolhidas.length}
              </span>
            </>
          ) : (
            <>
              {escolhidas[0].antes && <span className="selecao-antes">{escolhidas[0].antes}</span>}
              <span className="selecao-escolha">{escolhidas[0].rotulo}</span>
            </>
          ))}
        <svg className="selecao-seta" viewBox="0 0 24 24" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        ref={lista}
        id={`${id}-lista`}
        popover="auto"
        className="selecao-pop"
        style={{ positionAnchor: ancora } as CSSProperties}
      >
        <div className="selecao-lista" role="group" aria-label={rotulo}>
          {rotuloTodos && (
            <button type="button" className="selecao-opcao selecao-todos" aria-pressed={valor.length === 0} onClick={() => escolher(null)}>
              <span className="selecao-marca" aria-hidden />
              {rotuloTodos}
            </button>
          )}
          {opcoes.map((o) => (
            <button key={o.valor} type="button" className="selecao-opcao" aria-pressed={valor.includes(o.valor)} onClick={() => escolher(o.valor)}>
              <span className="selecao-marca" aria-hidden />
              {o.antes}
              <span className="selecao-opcao-rotulo">{o.rotulo}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
