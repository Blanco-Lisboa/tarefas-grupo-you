"use client";
import { useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Etiqueta, Responsavel } from "@/lib/dados";
import "@/components/ui/selecao.css";
import "./caderno.css";

// Menu ⋮ de cada tarefa (item 70), com a pele do Selecao (painel de vidro, popover do navegador: Esc e clique fora fecham).
// Opções do CRM; "Ligar a um lead" fica de fora: aqui não há leads.
export type Acoes = {
  duplicar: (id: string) => void;
  mover: (id: string) => void;
  marcarHora: (id: string, linha: number) => void;
  criarPara: (id: string, quem: Responsavel) => void;
  marcarPessoa: (id: string, quem: Responsavel) => void;
  etiqueta: (id: string, cor: Etiqueta) => void;
};

const PESSOAS: { valor: Responsavel; rotulo: string }[] = [{ valor: "natham", rotulo: "Natham" }, { valor: "matheus", rotulo: "Matheus" }];
// Cores suaves da paleta de etiquetas; "Sem" é a cor padrão (lavanda) mostrada em cinza.
const ETIQUETAS: { rotulo: string; cor: Etiqueta | null; valor: Etiqueta }[] = [
  { rotulo: "Prioridade", cor: "etiqueta-6", valor: "etiqueta-6" },
  { rotulo: "Não esquecer", cor: "etiqueta-1", valor: "etiqueta-1" },
  { rotulo: "Rápida", cor: "etiqueta-3", valor: "etiqueta-3" },
  { rotulo: "Sem", cor: null, valor: "etiqueta-5" },
];

const Icone = ({ children }: { children: ReactNode }) => <svg className="mt-ico" viewBox="0 0 20 20" aria-hidden="true">{children}</svg>;
const Pessoa = () => <Icone><circle cx="10" cy="7" r="3.2" /><path d="M3.8 17c.6-3.2 3-4.8 6.2-4.8s5.6 1.6 6.2 4.8" /></Icone>;

type Props = {
  id: string;
  titulo: string;
  cor: string;
  responsavel: Responsavel;
  /** Linhas de horário (rótulos "07:00"...), para "Marcar horário". */
  horas: string[];
  acoes: Acoes;
  aoExcluir: () => void;
};

export function MenuTarefa({ id, titulo, cor, responsavel, horas, acoes, aoExcluir }: Props) {
  const uid = useId();
  const pop = useRef<HTMLDivElement>(null);
  const [vista, setVista] = useState<"menu" | "hora" | "criar" | "pessoa">("menu");
  const ancora = `--menu-${uid.replace(/[^\w-]/g, "")}`;
  const feito = (f: () => void) => () => { f(); pop.current?.hidePopover(); };
  const pessoas = (aoEscolher: (q: Responsavel) => void, marcada?: Responsavel) => (
    <>
      <button type="button" className="selecao-opcao mt-voltar" onClick={() => setVista("menu")}>‹ Voltar</button>
      {PESSOAS.map((p) => (
        <button key={p.valor} type="button" className="selecao-opcao" aria-pressed={marcada === p.valor || undefined} onClick={feito(() => aoEscolher(p.valor))}>
          <Pessoa />
          <span className="selecao-opcao-rotulo">{p.rotulo}</span>
        </button>
      ))}
    </>
  );

  return (
    <>
      <button type="button" className="mt-pontos" popoverTarget={`${uid}-menu`} style={{ anchorName: ancora } as CSSProperties} aria-label={`Mais opções: ${titulo}`} title="Mais opções">
        <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="4" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="10" cy="16" r="1.6" /></svg>
      </button>
      <div
        ref={pop} id={`${uid}-menu`} popover="auto" className="selecao-pop mt-pop" style={{ positionAnchor: ancora } as CSSProperties}
        onToggle={(e) => { if ((e.nativeEvent as ToggleEvent).newState === "closed") setVista("menu"); }}
      >
        <div className="selecao-lista mt-lista" role="group" aria-label={`Opções de ${titulo}`}>
          {vista === "menu" && (
            <>
              <button type="button" className="selecao-opcao" onClick={feito(() => acoes.duplicar(id))}>
                <Icone><rect x="7" y="7" width="9" height="9" rx="2" /><path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /></Icone>
                <span className="selecao-opcao-rotulo">Duplicar pro dia seguinte</span>
              </button>
              <button type="button" className="selecao-opcao" onClick={feito(() => acoes.mover(id))}>
                <Icone><path d="M4 10h12M11 5l5 5-5 5" /></Icone>
                <span className="selecao-opcao-rotulo">Mover pro dia seguinte</span>
              </button>
              <button type="button" className="selecao-opcao" onClick={() => setVista("hora")}>
                <Icone><circle cx="10" cy="10" r="7" /><path d="M10 6v4l2.5 2" /></Icone>
                <span className="selecao-opcao-rotulo">Marcar horário…</span>
              </button>
              <button type="button" className="selecao-opcao" onClick={() => setVista("criar")}>
                <Icone><path d="M17 3 8.5 11.5M17 3l-5.5 14-3-5.5L3 8.5z" /></Icone>
                <span className="selecao-opcao-rotulo">Criar tarefa para…</span>
              </button>
              <button type="button" className="selecao-opcao" onClick={() => setVista("pessoa")}>
                <Pessoa />
                <span className="selecao-opcao-rotulo">Marcar pessoa…</span>
              </button>
              <p className="mt-titulo">Etiqueta</p>
              <div className="mt-etiquetas">
                {ETIQUETAS.map((e) => (
                  <button
                    key={e.rotulo} type="button" className="mt-etiqueta" aria-pressed={cor === e.valor}
                    style={e.cor ? ({ "--e": `var(--${e.cor})`, "--et": `var(--${e.cor}-texto)` } as CSSProperties) : undefined}
                    onClick={feito(() => acoes.etiqueta(id, e.valor))}
                  >{e.rotulo}</button>
                ))}
              </div>
              <hr className="mt-sep" />
              <button type="button" className="selecao-opcao mt-perigo" onClick={feito(aoExcluir)}>
                <Icone><path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6M8.5 9v4M11.5 9v4" /></Icone>
                <span className="selecao-opcao-rotulo">Excluir</span>
              </button>
            </>
          )}
          {vista === "hora" && (
            <>
              <button type="button" className="selecao-opcao mt-voltar" onClick={() => setVista("menu")}>‹ Voltar</button>
              <div className="mt-horas">
                {horas.map((h, k) => <button key={h} type="button" className="selecao-opcao" onClick={feito(() => acoes.marcarHora(id, k))}>{h}</button>)}
              </div>
            </>
          )}
          {vista === "criar" && pessoas((q) => acoes.criarPara(id, q))}
          {vista === "pessoa" && pessoas((q) => acoes.marcarPessoa(id, q), responsavel)}
        </div>
      </div>
    </>
  );
}
