"use client";
import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import "./selecao.css";

// Botão de seleção (item 42): clica, abre a lista, escolhe uma ou várias opções. Peça ÚNICA do sistema:
// toda tela que filtra ou escolhe entre opções usa este componente, ninguém faz o seu próprio.
// Desenho do modelo 1 Névoa (item 60): botão em vidro branco; a lista é um painel de vidro que flutua.
// A lista abre por cima de tudo (popover do navegador: fecha com Esc ou clique fora) e se prende ao botão (anchor).
/** chip = como a escolha aparece no botão fechado (pelo nome, em vez de bolinhas e contador). */
export type Opcao = { valor: string; rotulo: string; antes?: ReactNode; chip?: ReactNode; /** Linha fina acima desta opção (ex.: "Nenhuma", no fim da lista). */ separar?: boolean };

/** Chips lado a lado; os que não cabem somem e viram "+N". */
function Chips({ itens }: { itens: ReactNode[] }) {
  const caixa = useRef<HTMLSpanElement>(null);
  const [cabem, setCabem] = useState(itens.length);
  useLayoutEffect(() => {
    const c = caixa.current;
    if (!c) return;
    const medir = () => setCabem(Math.max(1, [...c.children].filter((f) => (f as HTMLElement).offsetLeft + (f as HTMLElement).offsetWidth <= c.clientWidth + 1).length));
    medir();
    const o = new ResizeObserver(medir);
    o.observe(c);
    return () => o.disconnect();
  }, [itens.length]);
  const fora = Math.max(0, itens.length - cabem);
  return (
    <>
      <span className="selecao-chips" ref={caixa}>
        {itens.map((c, i) => <span key={i} className="selecao-chip" style={i >= cabem ? { visibility: "hidden" } : undefined}>{c}</span>)}
      </span>
      {fora > 0 && <span className="selecao-mais" aria-label={`mais ${fora}`}>+{fora}</span>}
    </>
  );
}

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
  /** Última linha da lista, ex.: "Nova tag": fecha a lista e chama aoClicar. */
  acao?: { rotulo: string; aoClicar: () => void };
  /** Escolha única ainda vazia: o rótulo fica pequeno à esquerda e este texto (cinza) à direita, como nos campos preenchidos. Ex.: "Escolher". */
  vazio?: string;
};

export function Selecao({ rotulo, opcoes, valor, aoMudar, multipla = true, rotuloTodos, soIcone, acao, vazio }: Props) {
  const id = useId();
  const lista = useRef<HTMLDivElement>(null);
  const ancora = `--selecao-${id.replace(/[^\w-]/g, "")}`;
  const escolhidas = opcoes.filter((o) => valor.includes(o.valor));
  const chips = escolhidas.length > 0 && escolhidas.every((o) => o.chip);
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
        {multipla || (!escolhidas.length && !vazio) ? <span>{rotulo}</span> : <span className="selecao-rotulo-p">{rotulo}</span>}
        {!multipla && !escolhidas.length && vazio && <span className="selecao-escolha selecao-escolha-vazio">{vazio}</span>}
        {escolhidas.length > 0 &&
          (chips ? (
            <Chips itens={escolhidas.map((o) => o.chip)} />
          ) : icone ? (
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
            <button key={o.valor} type="button" className="selecao-opcao" data-separar={o.separar || undefined} aria-pressed={valor.includes(o.valor)} onClick={() => escolher(o.valor)}>
              <span className="selecao-marca" aria-hidden />
              {o.antes}
              <span className="selecao-opcao-rotulo">{o.rotulo}</span>
            </button>
          ))}
          {acao && (
            <button type="button" className="selecao-opcao selecao-acao" onClick={() => { lista.current?.hidePopover(); acao.aoClicar(); }}>
              <span className="selecao-mais-icone" aria-hidden>+</span>
              {acao.rotulo}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
