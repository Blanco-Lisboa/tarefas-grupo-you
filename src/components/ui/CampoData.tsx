"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { andar, deTexto, inicioSemana, nomeMes, paraDia, somarDias } from "@/components/calendario/logica";
import "./selecao.css";
import "./campo-data.css";

// Campo de data (item 64): no lugar do campo de data nativo do navegador (foto 06), com a MESMA pele do Selecao (botão de vidro,
// painel de vidro que flutua, escolhido em azul). Peça ÚNICA: todo campo de data do sistema usa este.
//
//   <CampoData rotulo="Data" valor={dia} aoMudar={setDia} />            // valor "AAAA-MM-DD"; "" = sem data
//   <CampoData rotulo="Termina no dia" valor={fim} min={inicio} aoMudar={setFim} semLimpar />
//   <CampoData rotulo="Começa" valor={dia} hora={hora} aoMudar={(d, h) => …} />   // com hora (item 76)
//
// Com `hora` ("HH:MM" ou ""), o painel ganha ao lado as rodas de hora e minuto (como no CRM, foto 24; no celular, embaixo):
// escolher o dia não fecha, "Selecionar" devolve aoMudar(dia, hora) e "Limpar" devolve aoMudar("", "").
// Teclado no painel: setas andam 1 dia / 1 semana, PageUp/PageDown 1 mês, Home/End início/fim da semana, Enter escolhe,
// Esc fecha. Nas rodas: setas, PageUp/PageDown (5), Home/End, Enter seleciona. Datas pelo relógio local (paraDia).
type Props = {
  rotulo: string;
  valor: string;
  aoMudar: (dia: string, hora?: string) => void;
  /** Primeiro dia que pode ser escolhido ("AAAA-MM-DD"). Também é o dia sugerido quando o campo está vazio. */
  min?: string;
  /** Esconde o "Limpar" quando o campo não pode ficar vazio. */
  semLimpar?: boolean;
  /** Texto do botão sem data. */
  vazio?: string;
  /** Liga as rodas de hora e minuto. "" = sem hora ainda. */
  hora?: string;
  /** Hora sugerida quando `hora` está vazia. */
  horaPadrao?: string;
};

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
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

export function CampoData({ rotulo, valor, aoMudar, min, semLimpar, vazio = "Sem data", hora, horaPadrao = "09:00" }: Props) {
  const id = useId();
  const painel = useRef<HTMLDivElement>(null);
  const grade = useRef<HTMLDivElement>(null);
  const ancora = `--data-${id.replace(/[^\w-]/g, "")}`;
  const hoje = paraDia(new Date());
  const comHora = hora !== undefined;
  const [aberto, setAberto] = useState(false);
  const [foco, setFoco] = useState(valor || hoje);
  const [mes, setMes] = useState(mesDe(valor || hoje));
  // Com hora, o que se escolhe no painel fica em rascunho até o "Selecionar"
  const [rascunho, setRascunho] = useState({ dia: valor, hora: hora || horaPadrao });

  // Abriu ou o teclado andou: o foco vai para o dia certo da grade
  useEffect(() => {
    if (aberto) grade.current?.querySelector<HTMLButtonElement>(`[data-dia="${foco}"]`)?.focus();
  }, [aberto, foco]);

  const fora = (dia: string) => !!min && dia < min;
  const fechar = () => painel.current?.hidePopover();
  const escolher = (dia: string) => {
    if (fora(dia)) return;
    if (comHora) return setRascunho((r) => ({ ...r, dia }));
    aoMudar(dia);
    fechar();
  };
  const selecionar = () => {
    aoMudar(rascunho.dia, rascunho.hora);
    fechar();
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

  const escolhido = comHora ? rascunho.dia : valor;
  const dias = Array.from({ length: 42 }, (_, i) => somarDias(inicioSemana(mes), i));
  const tabulavel = foco.startsWith(mes.slice(0, 7)) ? foco : mes;
  const texto = valor ? `${curta(valor)}${hora ? ` · ${hora}` : ""}` : vazio;
  // Minuto fora do passo de 5 (dado antigo, ex.: 09:07) entra na roda para não ser arredondado sem pedir
  const minutos = hora && !MINUTOS.includes(hora.slice(3)) ? [...MINUTOS, hora.slice(3)].sort() : MINUTOS;

  return (
    <>
      <button
        type="button"
        className="selecao-botao campo-data-botao"
        popoverTarget={`${id}-painel`}
        aria-label={`${rotulo}: ${valor ? `${extenso.format(deTexto(valor))}${hora ? `, ${hora}` : ""}` : vazio}`}
        style={{ anchorName: ancora } as CSSProperties}
      >
        <svg className="campo-data-icone" viewBox="0 0 24 24" aria-hidden>
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
        <span className={valor ? "campo-data-valor" : "campo-data-vazio"}>{texto}</span>
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
            const dia = valor || min || hoje;
            setFoco(dia);
            setMes(mesDe(dia));
            setRascunho({ dia, hora: hora || horaPadrao });
          }
          setAberto(abriu);
        }}
      >
        <div className="selecao-lista campo-data-painel" role="group" aria-label={rotulo}>
          <div className="campo-data-corpo">
            <div className="campo-data-cal">
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
                    aria-pressed={d === escolhido}
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
            </div>
            {comHora && (
              <div className="campo-data-rodas">
                <Roda rotulo="Hora" opcoes={HORAS} valor={rascunho.hora.slice(0, 2)} aberto={aberto} confirmar={selecionar}
                  aoMudar={(h) => setRascunho((r) => ({ ...r, hora: `${h}:${r.hora.slice(3)}` }))} />
                <span className="campo-data-dois-pontos" aria-hidden>:</span>
                <Roda rotulo="Minuto" opcoes={minutos} valor={rascunho.hora.slice(3)} aberto={aberto} confirmar={selecionar}
                  aoMudar={(m) => setRascunho((r) => ({ ...r, hora: `${r.hora.slice(0, 2)}:${m}` }))} />
              </div>
            )}
          </div>
          <div className="campo-data-pe">
            {!semLimpar && <button type="button" className="campo-data-acao campo-data-limpar" onClick={() => { aoMudar("", ""); fechar(); }}>Limpar</button>}
            {comHora
              ? <button type="button" className="btn" disabled={!rascunho.dia} onClick={selecionar}>Selecionar</button>
              : <button type="button" className="campo-data-acao" disabled={fora(hoje)} onClick={() => escolher(hoje)}>Hoje</button>}
          </div>
        </div>
      </div>
    </>
  );
}

const ITEM = 32; // altura de cada linha da roda (o mesmo valor no campo-data.css)
const suave = (): ScrollBehavior => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
const TECLA: Record<string, (i: number, fim: number) => number> = {
  ArrowUp: (i) => i - 1, ArrowDown: (i) => i + 1, PageUp: (i) => i - 5, PageDown: (i) => i + 5, Home: () => 0, End: (_, fim) => fim,
};

/** Roda de rolagem (item 76): a linha do meio é a escolhida. Rolar (roda do mouse, dedo) escolhe quando a roda para;
    clicar numa linha ou usar as setas gira a roda até ela. */
function Roda({ rotulo, opcoes, valor, aoMudar, aberto, confirmar }: {
  rotulo: string; opcoes: string[]; valor: string; aoMudar: (v: string) => void; aberto: boolean; confirmar: () => void;
}) {
  const id = useId();
  const lista = useRef<HTMLDivElement>(null);
  const espera = useRef(0);
  const jaAberta = useRef(false);
  const i = Math.max(0, opcoes.indexOf(valor));

  // O valor mudou por fora (abrir, teclado, clique): a roda gira até ele. Ao abrir, pula direto (sem girar).
  useLayoutEffect(() => {
    const el = lista.current;
    if (!el || !aberto) { jaAberta.current = false; return; }
    if (Math.abs(el.scrollTop - i * ITEM) > 1) el.scrollTo({ top: i * ITEM, behavior: jaAberta.current ? suave() : "auto" });
    jaAberta.current = true;
  }, [i, aberto]);
  useEffect(() => () => clearTimeout(espera.current), []);

  const teclar = (e: KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); return confirmar(); }
    const passo = TECLA[e.key];
    if (!passo) return;
    e.preventDefault();
    aoMudar(opcoes[Math.min(opcoes.length - 1, Math.max(0, passo(i, opcoes.length - 1)))]);
  };
  const rolou = () => {
    clearTimeout(espera.current);
    espera.current = window.setTimeout(() => {
      const el = lista.current;
      if (el) aoMudar(opcoes[Math.min(opcoes.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM)))]);
    }, 120);
  };

  return (
    <div
      ref={lista}
      className="roda"
      role="listbox"
      tabIndex={0}
      aria-label={rotulo}
      aria-activedescendant={`${id}-${i}`}
      onKeyDown={teclar}
      onScroll={rolou}
    >
      {opcoes.map((o, n) => (
        <div key={o} id={`${id}-${n}`} role="option" aria-selected={n === i} className="roda-item" onClick={() => aoMudar(o)}>{o}</div>
      ))}
    </div>
  );
}
