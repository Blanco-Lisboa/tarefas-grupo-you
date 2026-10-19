"use client";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { hashString, rng, type ArtRecipe } from "./arte";
import { ArtCanvas } from "./ArteCanvas";
import "./pastas.css";

// Pasta de vidro (componente Glass Folder Cards, vestido com a Névoa). Três camadas, de trás para a frente:
// fundo azul com arte líquida, os arquivos, e o vidro fosco claro na frente, que borra o que passa atrás.
// Formato e movimento do original: cantos redondos de 22 e um leve quique ao abrir.

export type ArquivoPasta = {
  nome: string;
  meta?: string;
  arte: ArtRecipe;
};

type Props = {
  rotulo: string;
  arquivos: ArquivoPasta[];
  arte: ArtRecipe;
  seed?: number;
  defaultOpen?: boolean;
  /** Atraso da entrada, para escalonar uma fileira de pastas. */
  atraso?: number;
  onSelecionar?: (arquivo: ArquivoPasta) => void;
  /** Cor da empresa (suave): fundo da pasta, base das folhas e sombra. */
  tom?: { base: string; sombra: string };
  /** Texto sob o nome, quando não são "N peças" (ex.: "10 ideias"). */
  legenda?: string;
  /** Aviso mostrado dentro da pasta aberta quando ela não tem arquivos. */
  vazio?: string;
  /** Botão solto no canto da pasta (o ⋮ de renomear e excluir). Fica fora do vidro, então não abre a pasta. */
  acoes?: ReactNode;
  /** Com a pasta aberta (ou a lista "Ver todas"), mostra "+ Nova folha". */
  aoNovaFolha?: () => void;
};

// Geometria nas unidades da pasta: palco de 340 x 272, escalado até `largura`.
const W = 340, H = 272, ALTURA_ABA = 54, FRENTE_H = H - 74;
const FOLHA_W = 272, FOLHA_H = 184, VISIVEIS = 4;

const FUNDO = "M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z";
const FRENTE = `M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 ${FRENTE_H - 22}A22 22 0 0 1 318 ${FRENTE_H}L22 ${FRENTE_H}A22 22 0 0 1 0 ${FRENTE_H - 22}Z`;

const leque = (i: number, n: number) => (n <= 1 ? 0 : (i / (n - 1)) * 2 - 1);

export function PastaDeVidro({ rotulo, arquivos, arte, seed = 3, defaultOpen = false, atraso = 0, onSelecionar, tom, legenda, vazio, acoes, aoNovaFolha }: Props) {
  const uid = useId().replace(/:/g, "");
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const [aberta, setAberta] = useState(defaultOpen);
  const [entrou, setEntrou] = useState(false);
  const [dpr, setDpr] = useState(1);
  const [largura, setLargura] = useState(340);
  const k = largura / W;
  const densidade = Math.min(1.5, dpr) * k;

  // Escala conforme o espaço da coluna (a pasta nunca passa de 340 nem some em tela estreita).
  useEffect(() => {
    const el = raiz.current?.parentElement;
    if (!el) return;
    const medir = () => {
      setDpr(window.devicePixelRatio || 1);
      setLargura(Math.max(220, Math.min(340, Math.floor(el.clientWidth))));
    };
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Entrada: a pasta se monta quando aparece na tela pela primeira vez.
  useEffect(() => {
    const el = raiz.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setEntrou(true);
      return;
    }
    let t = 0;
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        io.disconnect();
        t = window.setTimeout(() => setEntrou(true), atraso);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, [atraso]);

  // Luz e paralaxe seguem o mouse sem re-renderizar.
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    let raf = 0, px = 0, py = 0;
    const escrever = () => {
      raf = 0;
      el.style.setProperty("--gf-px", px.toFixed(3));
      el.style.setProperty("--gf-py", py.toFixed(3));
    };
    const mover = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width) * 2 - 1;
      py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(escrever);
    };
    const sair = () => {
      px = py = 0;
      if (!raf) raf = requestAnimationFrame(escrever);
    };
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", sair);
    return () => {
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", sair);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Esc ou clique fora fecha.
  useEffect(() => {
    if (!aberta) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || document.querySelector("dialog[open]")) return; // com o card aberto, o Esc fecha só o card
      setAberta(false);
      botao.current?.focus();
    };
    const fora = (e: PointerEvent) => {
      const alvo = e.target as Element;
      if (!raiz.current?.contains(alvo) && !alvo.closest("dialog, .gf-nova")) setAberta(false);
    };
    document.addEventListener("keydown", tecla);
    document.addEventListener("pointerdown", fora);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.removeEventListener("pointerdown", fora);
    };
  }, [aberta]);

  // As mais novas ficam na frente da pilha, perto do vidro.
  const visiveis = arquivos.slice(Math.max(0, arquivos.length - VISIVEIS));
  const n = arquivos.length;
  const meta = legenda ?? (n === 0 ? "Pasta vazia" : n === 1 ? "1 peça" : `${n} peças`);
  const [lista, setLista] = useState(false);

  return (
    <>
    <div
      ref={raiz}
      className="gf-root"
      data-open={aberta || undefined}
      data-entered={entrou || undefined}
      style={{ width: largura, height: (H + ALTURA_ABA) * k, ...(tom && { "--gf-base": tom.base, "--gf-sombra": tom.sombra }) } as CSSProperties}
    >
      <div className="gf-stage" style={{ transform: `translateY(${ALTURA_ABA * k}px) scale(${k})` }}>
        <div className="gf-tilt">
          <div className="gf-shadow" aria-hidden="true" />

          <div className="gf-back" style={{ clipPath: `path('${FUNDO}')` }} aria-hidden="true">
            <ArtCanvas className="gf-art" art={arte} seed={seed} w={W + 24} h={H + 24} density={densidade} priority={0} />
            <div className="gf-back-sheen" />
          </div>
          <svg className="gf-rim gf-back-rim" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            <path d={FUNDO} />
          </svg>

          <div className="gf-front" style={{ clipPath: `path('${FRENTE}')` }}>
            <div className="gf-tint" aria-hidden="true" />
            <div className="gf-spec" aria-hidden="true" />
            <svg className="gf-rim gf-front-rim" viewBox={`0 0 ${W} ${FRENTE_H}`} aria-hidden="true">
              <defs>
                <linearGradient id={`gf-rim-${uid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
                  <stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.12" />
                </linearGradient>
              </defs>
              <path d={FRENTE} stroke={`url(#gf-rim-${uid})`} />
            </svg>
            <button
              ref={botao}
              type="button"
              className="gf-hit"
              aria-expanded={aberta}
              aria-label={`${aberta ? "Fechar" : "Abrir"} ${rotulo}, ${meta}`}
              onClick={() => setAberta(!aberta)}
            />
            <div className="gf-label">
              <span className="gf-title">{rotulo}</span>
              <span className="gf-meta">{meta}</span>
            </div>
          </div>

          {/* o conteúdo: depois do vidro na ordem do Tab, atrás dele na tela */}
          <div className="gf-files" role="list" aria-label={`Peças de ${rotulo}`} inert={!aberta}>
            {n === 0 && vazio && <p className="gf-vazio">{vazio}</p>}
            {visiveis.map((f, v) => {
              const jitter = rng(hashString(f.nome));
              return (
                <div key={f.nome} role="listitem" className="gf-sheet-slot">
                  <button
                    type="button"
                    className="gf-sheet"
                    onClick={() => onSelecionar?.(f)}
                    style={{
                  "--gf-slot": leque(v, visiveis.length),
                  "--gf-depth": visiveis.length - 1 - v,
                  "--gf-jx": `${((jitter() - 0.5) * 10).toFixed(2)}px`,
                  "--gf-jr": `${((jitter() - 0.5) * 3.2).toFixed(2)}deg`,
                  zIndex: v + 1,
                    } as CSSProperties}
                  >
                  <ArtCanvas className="gf-sheet-art" art={f.arte} seed={hashString(f.nome) % 997} w={FOLHA_W} h={FOLHA_H} density={Math.min(densidade, 1.25)} priority={1} />
                  <span className="gf-sheet-head">
                    <span className="gf-sheet-name">{f.nome}</span>
                    {f.meta ? <span className="gf-sheet-meta">{f.meta}</span> : null}
                  </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {acoes && <div className="gf-acoes" style={{ top: (ALTURA_ABA + 232) * k - 16, right: 20 * k }}>{acoes}</div>}
    </div>
    {aoNovaFolha && (aberta || lista) && <button type="button" className="gf-todas gf-nova" onClick={aoNovaFolha}>+ Nova folha</button>}
    {n > VISIVEIS && (
      <>
        <button type="button" className="gf-todas" aria-expanded={lista} onClick={() => setLista(!lista)}>
          {lista ? "Esconder lista" : `Ver todas (${n})`}
        </button>
        {lista && (
          <ul className="gf-lista" aria-label={`Todas as peças de ${rotulo}`}>
            {arquivos.map((f) => (
              <li key={f.nome}>
                <button type="button" onClick={() => onSelecionar?.(f)}>{f.nome}<small>{f.meta}</small></button>
              </li>
            ))}
          </ul>
        )}
      </>
    )}
    </>
  );
}
