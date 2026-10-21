"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { andar, deTexto, inicioSemana, nomeMes, paraDia, somarDias } from "@/components/calendario/logica";
import "./selecao.css";
import "./campo-data.css";

// Campo de data (item 64): no lugar do campo de data nativo do navegador (foto 06), com a MESMA pele do Selecao (botão de vidro,
// painel de vidro que flutua, escolhido em azul). Peça ÚNICA: todo campo de data do sistema usa este.
//
//   <CampoData rotulo="Data" valor={dia} aoMudar={setDia} />            // valor "AAAA-MM-DD"; "" = sem data
//   <CampoData rotulo="Termina no dia" valor={fim} min={inicio} aoMudar={setFim} semLimpar />
//   <CampoData rotulo="Começa" valor={dia} hora={hora} aoMudar={(d, h) => …} />   // com hora (item 76)
//   <CampoData rotulo="Ir para a data" valor={dia} aoMudar={ir} semLimpar titulo={<>18 a 24 de outubro</>} />  // o próprio título abre o painel (item 224)
//
// Com `hora` ("HH:MM" ou ""), o painel ganha ao lado as rodas de hora e minuto (como no CRM, foto 24; no celular, embaixo):
// escolher o dia não fecha, "Selecionar" devolve aoMudar(dia, hora) e "Limpar" devolve aoMudar("", "").
// Teclado no painel: setas andam 1 dia / 1 semana, PageUp/PageDown 1 mês, Home/End início/fim da semana, Enter escolhe,
// Esc fecha. Nas rodas: arrastar (mouse ou dedo), rodinha, setas, PageUp/PageDown (5), Home/End, Enter seleciona; as rodas
// são circulares e, sem hora escolhida, abrem em 00:00 (item 84). Datas pelo relógio local (paraDia).
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
  /** Liga as rodas de hora e minuto. "" = sem hora ainda (as rodas abrem em 00:00, item 84). */
  hora?: string;
  /** No lugar do botão de vidro, um texto clicável (o título do Calendário, item 224); o painel é o mesmo. */
  titulo?: ReactNode;
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

export function CampoData({ rotulo, valor, aoMudar, min, semLimpar, vazio = "Sem data", hora, titulo }: Props) {
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
  const [rascunho, setRascunho] = useState({ dia: valor, hora: hora || "00:00" });

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
        className={titulo ? "campo-data-titulo" : "selecao-botao campo-data-botao"}
        popoverTarget={`${id}-painel`}
        aria-label={`${rotulo}: ${valor ? `${extenso.format(deTexto(valor))}${hora ? `, ${hora}` : ""}` : vazio}`}
        style={{ anchorName: ancora } as CSSProperties}
      >
        {titulo ?? <>
          <svg className="campo-data-icone" viewBox="0 0 24 24" aria-hidden>
            <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
            <path d="M3.5 10h17M8 3v4M16 3v4" />
          </svg>
          <span className={valor ? "campo-data-valor" : "campo-data-vazio"}>{texto}</span>
        </>}
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
            setRascunho({ dia, hora: hora || "00:00" });
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
const VISIVEIS = 3; // linhas desenhadas acima e abaixo da do meio
const volta = (k: number, n: number) => ((k % n) + n) % n;
const reduzido = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const TECLA: Record<string, (k: number) => number> = {
  ArrowUp: (k) => k - 1, ArrowDown: (k) => k + 1, PageUp: (k) => k - 5, PageDown: (k) => k + 5,
};

/** Roda de horário (itens 76 e 84), como a do iPhone: CIRCULAR (depois de 23 vem 00, e vice-versa, sem fim) e a linha do
    meio é a escolhida. Arrastar com o mouse ou o dedo gira a roda, com inércia leve ao soltar, e encaixa numa linha;
    clicar numa linha gira até ela; rodinha do mouse e setas também giram. Não usa a rolagem do navegador (o mouse não
    arrasta rolagem, era o defeito do item 84): `pos` é a posição contínua, em linhas, e cada linha é desenhada pela conta. */
function Roda({ rotulo, opcoes, valor, aoMudar, aberto, confirmar }: {
  rotulo: string; opcoes: string[]; valor: string; aoMudar: (v: string) => void; aberto: boolean; confirmar: () => void;
}) {
  const n = opcoes.length;
  const idx = Math.max(0, opcoes.indexOf(valor));
  const [pos, setPos] = useState(idx);
  const posRef = useRef(pos);
  const animacao = useRef(0);
  const alvo = useRef<number | null>(null); // linha para onde a roda está girando (tecla rápida soma a partir dela)
  const espera = useRef(0);
  const arraste = useRef<{ y: number; pos: number; t: number; v: number; moveu: boolean } | null>(null);
  const caixa = useRef<HTMLDivElement>(null);

  const mover = (p: number) => { posRef.current = p; setPos(p); };
  const parar = () => { cancelAnimationFrame(animacao.current); clearTimeout(espera.current); alvo.current = null; };
  // Gira até a linha k (inteira) e só então avisa o valor. Sem animação com prefers-reduced-motion.
  const irPara = (k: number) => {
    parar();
    const de = posRef.current;
    const fim = () => { alvo.current = null; mover(k); aoMudar(opcoes[volta(k, n)]); };
    if (reduzido() || de === k) return fim();
    alvo.current = k;
    const dur = Math.min(450, 160 + Math.abs(k - de) * 45), t0 = performance.now();
    const passo = (t: number) => {
      const x = Math.min(1, (t - t0) / dur);
      if (x >= 1) return fim();
      mover(de + (k - de) * (1 - (1 - x) ** 3));
      animacao.current = requestAnimationFrame(passo);
    };
    animacao.current = requestAnimationFrame(passo);
  };

  // O valor mudou por fora ou o painel abriu: a roda vai para a linha dele pelo caminho mais curto da volta
  useLayoutEffect(() => {
    if (!aberto || arraste.current) return;
    const atual = Math.round(posRef.current);
    if (volta(atual, n) === idx) return;
    const d = volta(idx - atual + Math.floor(n / 2), n) - Math.floor(n / 2);
    parar();
    mover(atual + d);
  }, [idx, aberto, n]);
  useEffect(() => parar, []);

  // Rodinha do mouse: anda junto com o giro e encaixa quando a rodinha para. Precisa de ouvinte não passivo (preventDefault).
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const rodinha = (e: WheelEvent) => {
      e.preventDefault();
      parar();
      mover(posRef.current + (e.deltaY * (e.deltaMode === 1 ? 16 : 1)) / ITEM);
      espera.current = window.setTimeout(() => irPara(Math.round(posRef.current)), 120);
    };
    el.addEventListener("wheel", rodinha, { passive: false });
    return () => el.removeEventListener("wheel", rodinha);
  });

  const teclar = (e: KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); return confirmar(); }
    const k = alvo.current ?? Math.round(posRef.current);
    const destino = e.key === "Home" ? k - volta(k, n) : e.key === "End" ? k - volta(k, n) + n - 1 : TECLA[e.key]?.(k);
    if (destino === undefined) return;
    e.preventDefault();
    irPara(destino);
  };

  const meio = Math.round(pos);
  return (
    <div
      ref={caixa}
      className="roda"
      role="spinbutton"
      tabIndex={0}
      aria-label={rotulo}
      aria-valuetext={opcoes[volta(meio, n)]}
      aria-valuenow={Number(opcoes[volta(meio, n)])}
      onKeyDown={teclar}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        parar();
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.focus({ preventScroll: true });
        arraste.current = { y: e.clientY, pos: posRef.current, t: e.timeStamp, v: 0, moveu: false };
      }}
      onPointerMove={(e) => {
        const a = arraste.current;
        if (!a) return;
        const p = a.pos - (e.clientY - a.y) / ITEM; // dedo para cima = valores seguintes sobem para o meio
        const dt = e.timeStamp - a.t;
        if (dt > 0) a.v = 0.6 * a.v + 0.4 * ((p - posRef.current) / dt); // linhas por ms, suavizado
        a.t = e.timeStamp;
        if (Math.abs(e.clientY - a.y) > 4) a.moveu = true;
        mover(p);
      }}
      onPointerUp={(e) => {
        const a = arraste.current;
        arraste.current = null;
        if (!a) return;
        if (!a.moveu) {
          // Clique: gira até a linha clicada (o meio da roda fica a 80px do topo)
          const topo = e.currentTarget.getBoundingClientRect().top;
          return irPara(Math.round(posRef.current + (e.clientY - topo - 80) / ITEM));
        }
        const parado = e.timeStamp - a.t > 80; // segurou parado antes de soltar: sem inércia
        const inercia = parado ? 0 : Math.max(-8, Math.min(8, a.v * 140)); // inércia leve: no máximo 8 linhas a mais
        irPara(Math.round(posRef.current + inercia));
      }}
      onPointerCancel={() => { arraste.current = null; irPara(Math.round(posRef.current)); }}
    >
      {Array.from({ length: VISIVEIS * 2 + 1 }, (_, j) => {
        const k = meio - VISIVEIS + j;
        return (
          <div key={k} className="roda-item" aria-hidden data-meio={k === meio || undefined}
            style={{ transform: `translateY(${(k - pos) * ITEM}px)` }}>
            {opcoes[volta(k, n)]}
          </div>
        );
      })}
    </div>
  );
}
