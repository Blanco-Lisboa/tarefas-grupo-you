"use client";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { andar, deTexto, inicioSemana, nomeMes, paraDia, somarDias } from "@/components/calendario/logica";
import "./selecao.css";
import "./campo-data.css";

// Campo de data (item 64): no lugar do campo de data nativo do navegador (foto 06), com a MESMA pele do Selecao (botão de vidro,
// painel de vidro que flutua, escolhido em azul). Peça ÚNICA: todo campo de data do sistema usa este.
//
//   <CampoData rotulo="Data" valor={dia} aoMudar={setDia} />            // valor "AAAA-MM-DD"; "" = sem data
//   <CampoData rotulo="Termina no dia" valor={fim} min={inicio} aoMudar={setFim} semLimpar />
//
// Teclado no painel: setas andam 1 dia / 1 semana, PageUp/PageDown 1 mês, Home/End início/fim da semana, Enter escolhe,
// Esc fecha. Datas pelo relógio local (paraDia), nunca toISOString.
type Props = {
  rotulo: string;
  valor: string;
  aoMudar: (dia: string) => void;
  /** Primeiro dia que pode ser escolhido ("AAAA-MM-DD"). */
  min?: string;
  /** Esconde o "Limpar" quando o campo não pode ficar vazio. */
  semLimpar?: boolean;
  /** Texto do botão sem data. */
  vazio?: string;
};

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const extenso = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" });
const curta = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}/${dia.slice(0, 4)}`;
const mesDe = (dia: string) => `${dia.slice(0, 7)}-01`;
const PASSO: Record<string, (d: string) => string> = {
  ArrowLeft: (d) => somarDias(d, -1),
  ArrowRight: (d) => somarDias(d, 1),
  ArrowUp: (d) => somarDias(d, -7),
  ArrowDown: (d) => somarDias(d, 7),
  Home: (d) => inicioSemana(d),
  End: (d) => somarDias(inicioSemana(d), 6),
  PageUp: (d) => mesmoDia(d, -1),
  PageDown: (d) => mesmoDia(d, 1),
};
/** Mesmo dia no mês vizinho; 31/10 - 1 mês = 30/09 (o último dia, não 01/10). */
function mesmoDia(dia: string, passo: 1 | -1) {
  const alvo = andar("mes", dia, passo);
  const ultimo = new Date(deTexto(alvo).getFullYear(), deTexto(alvo).getMonth() + 1, 0).getDate();
  return `${alvo.slice(0, 8)}${String(Math.min(Number(dia.slice(8, 10)), ultimo)).padStart(2, "0")}`;
}

export function CampoData({ rotulo, valor, aoMudar, min, semLimpar, vazio = "Sem data" }: Props) {
  const id = useId();
  const painel = useRef<HTMLDivElement>(null);
  const grade = useRef<HTMLDivElement>(null);
  const ancora = `--data-${id.replace(/[^\w-]/g, "")}`;
  const hoje = paraDia(new Date());
  const [aberto, setAberto] = useState(false);
  const [foco, setFoco] = useState(valor || hoje);
  const [mes, setMes] = useState(mesDe(valor || hoje));

  // Abriu ou o teclado andou: o foco vai para o dia certo da grade
  useEffect(() => {
    if (aberto) grade.current?.querySelector<HTMLButtonElement>(`[data-dia="${foco}"]`)?.focus();
  }, [aberto, foco]);

  const fora = (dia: string) => !!min && dia < min;
  const escolher = (dia: string) => {
    if (fora(dia)) return;
    aoMudar(dia);
    painel.current?.hidePopover();
  };
  const teclar = (e: KeyboardEvent) => {
    const passo = PASSO[e.key];
    if (!passo) return;
    e.preventDefault();
    // Parte do dia que está de fato focado: depois das setas de mês, o foco do estado ainda é do mês antigo (revisão R4)
    const novo = passo((e.target as HTMLElement).dataset.dia ?? foco);
    setFoco(novo);
    setMes(mesDe(novo));
  };

  const dias = Array.from({ length: 42 }, (_, i) => somarDias(inicioSemana(mes), i));
  const tabulavel = foco.startsWith(mes.slice(0, 7)) ? foco : mes;

  return (
    <>
      <button
        type="button"
        className="selecao-botao campo-data-botao"
        popoverTarget={`${id}-painel`}
        aria-label={`${rotulo}: ${valor ? extenso.format(deTexto(valor)) : vazio}`}
        style={{ anchorName: ancora } as CSSProperties}
      >
        <svg className="campo-data-icone" viewBox="0 0 24 24" aria-hidden>
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
        <span className={valor ? "campo-data-valor" : "campo-data-vazio"}>{valor ? curta(valor) : vazio}</span>
        <svg className="selecao-seta" viewBox="0 0 24 24" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        ref={painel}
        id={`${id}-painel`}
        popover="auto"
        className="selecao-pop campo-data-pop"
        style={{ positionAnchor: ancora } as CSSProperties}
        onToggle={(e) => {
          const abriu = e.newState === "open";
          if (abriu) {
            setFoco(valor || hoje);
            setMes(mesDe(valor || hoje));
          }
          setAberto(abriu);
        }}
      >
        <div className="selecao-lista campo-data-painel" role="group" aria-label={rotulo}>
          <div className="campo-data-topo">
            <span className="campo-data-mes" aria-live="polite">{nomeMes(mes)} {mes.slice(0, 4)}</span>
            <button type="button" className="campo-data-seta" aria-label="Mês anterior" onClick={() => setMes(andar("mes", mes, -1))}>
              <svg viewBox="0 0 24 24" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <button type="button" className="campo-data-seta" aria-label="Próximo mês" onClick={() => setMes(andar("mes", mes, 1))}>
              <svg viewBox="0 0 24 24" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>
          <div className="campo-data-grade" aria-hidden>
            {SEMANA.map((s, i) => <span key={i} className="campo-data-semana">{s}</span>)}
          </div>
          <div ref={grade} className="campo-data-grade" onKeyDown={teclar}>
            {dias.map((d) => (
              <button
                key={d}
                type="button"
                data-dia={d}
                className="campo-data-dia"
                tabIndex={d === tabulavel ? 0 : -1}
                aria-pressed={d === valor}
                aria-current={d === hoje ? "date" : undefined}
                aria-disabled={fora(d) || undefined}
                aria-label={`${extenso.format(deTexto(d))}${d === hoje ? ", hoje" : ""}`}
                data-outro-mes={!d.startsWith(mes.slice(0, 7)) || undefined}
                onClick={() => escolher(d)}
              >
                {Number(d.slice(8, 10))}
              </button>
            ))}
          </div>
          <div className="campo-data-pe">
            {!semLimpar && <button type="button" className="campo-data-acao campo-data-limpar" onClick={() => { aoMudar(""); painel.current?.hidePopover(); }}>Limpar</button>}
            <button type="button" className="campo-data-acao" disabled={fora(hoje)} onClick={() => escolher(hoje)}>Hoje</button>
          </div>
        </div>
      </div>
    </>
  );
}
