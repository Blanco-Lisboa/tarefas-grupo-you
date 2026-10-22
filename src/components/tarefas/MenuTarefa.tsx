"use client";
import { useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Etiqueta, Responsavel } from "@/lib/dados";
import { SeloEmpresa } from "@/components/ui/Marca";
import "@/components/ui/selecao.css";
import "./caderno.css";

// Menu ⋮ de cada tarefa (item 70), com a pele do Selecao (painel de vidro, popover do navegador: Esc e clique fora fecham).
// Opções do CRM; "Ligar a um lead" fica de fora: aqui não há leads.
export type Acoes = {
  duplicar: (id: string) => void;
  mover: (id: string) => void;
  marcarHora: (id: string, linha: number) => void;
  /** Item 275: duração em minutos (30, 60, 90...). */
  duracao: (id: string, minutos: number) => void;
  criarPara: (id: string, quem: Responsavel) => void;
  marcarPessoa: (id: string, quem: Responsavel) => void;
  etiqueta: (id: string, cor: Etiqueta) => void;
  /** empresaId "" = sem empresa. */
  empresa: (id: string, empresaId: string) => void;
};

const PESSOAS: { valor: Responsavel; rotulo: string }[] = [{ valor: "natham", rotulo: "Natham" }, { valor: "matheus", rotulo: "Matheus" }, { valor: "adrian", rotulo: "Adrian" }];
// Etiquetas do menu; "Sem" é a cor padrão (lavanda) mostrada em cinza. Prioridade é VERMELHA (item 100). A linha da folha mostra as três com nome.
export const ETIQUETAS: { rotulo: string; cor: Etiqueta | null; valor: Etiqueta }[] = [
  { rotulo: "Prioridade", cor: "etiqueta-7", valor: "etiqueta-7" },
  { rotulo: "Não esquecer", cor: "etiqueta-1", valor: "etiqueta-1" },
  { rotulo: "Rápida", cor: "etiqueta-3", valor: "etiqueta-3" },
  { rotulo: "Sem", cor: null, valor: "etiqueta-5" },
];

/** 30 -> "30 min", 60 -> "1h", 90 -> "1h30". */
export const rotuloDuracao = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, "0") : ""}`);

const Icone = ({ children }: { children: ReactNode }) => <svg className="mt-ico" viewBox="0 0 20 20" aria-hidden="true">{children}</svg>;
const Pessoa = () => <Icone><circle cx="10" cy="7" r="3.2" /><path d="M3.8 17c.6-3.2 3-4.8 6.2-4.8s5.6 1.6 6.2 4.8" /></Icone>;

type Props = {
  id: string;
  titulo: string;
  cor: string;
  responsavel: Responsavel;
  empresaId: string;
  empresas: { id: string; nome: string }[];
  /** Linhas de horário (rótulos "07:00"...), para "Marcar horário". */
  horas: string[];
  /** Duração atual e a maior que cabe (minutos). Máximo 0 = sem horário: o menu não oferece duração. */
  duracao: number;
  duracaoMax: number;
  /** Item 279: maior duração listada (até 6h e o fim do dia). As que passam de `duracaoMax` ficam apagadas, com `ocupadoAs`. */
  duracaoLimite: number;
  ocupadoAs?: string;
  /** Linhas de horário já ocupadas por outra tarefa ou bloco (aparecem desligadas em "Marcar horário"). */
  ocupadas?: ReadonlySet<number>;
  acoes: Acoes;
  aoExcluir: () => void;
  /** Quem só pode editar (enviou a tarefa, não é dono) não apaga. */
  semExcluir?: boolean;
};

export function MenuTarefa({ id, titulo, cor, responsavel, empresaId, empresas, horas, duracao, duracaoMax, duracaoLimite, ocupadoAs, ocupadas, acoes, aoExcluir, semExcluir }: Props) {
  const uid = useId();
  const pop = useRef<HTMLDivElement>(null);
  const [vista, setVista] = useState<"menu" | "hora" | "duracao" | "criar" | "pessoa" | "empresa" | "excluir">("menu");
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
              {duracaoLimite >= 60 && (
                <button type="button" className="selecao-opcao" onClick={() => setVista("duracao")}>
                  <Icone><path d="M10 3v14M6 5.5l4-2.5 4 2.5M6 14.5l4 2.5 4-2.5" /></Icone>
                  <span className="selecao-opcao-rotulo">Duração: {rotuloDuracao(duracao)}…</span>
                </button>
              )}
              <button type="button" className="selecao-opcao" onClick={() => setVista("criar")}>
                <Icone><path d="M17 3 8.5 11.5M17 3l-5.5 14-3-5.5L3 8.5z" /></Icone>
                <span className="selecao-opcao-rotulo">Criar tarefa para…</span>
              </button>
              <button type="button" className="selecao-opcao" onClick={() => setVista("pessoa")}>
                <Pessoa />
                <span className="selecao-opcao-rotulo">Marcar pessoa…</span>
              </button>
              <button type="button" className="selecao-opcao" onClick={() => setVista("empresa")}>
                <Icone><path d="M4 17V4h8v13M12 8h4v9M2.5 17h15M7 7.5h2M7 11h2" /></Icone>
                <span className="selecao-opcao-rotulo">Mudar empresa…</span>
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
              {!semExcluir && (
                <>
                  <hr className="mt-sep" />
                  <button type="button" className="selecao-opcao mt-perigo" onClick={() => setVista("excluir")}>
                    <Icone><path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6M8.5 9v4M11.5 9v4" /></Icone>
                    <span className="selecao-opcao-rotulo">Excluir</span>
                  </button>
                </>
              )}
            </>
          )}
          {vista === "hora" && (
            <>
              <button type="button" className="selecao-opcao mt-voltar" onClick={() => setVista("menu")}>‹ Voltar</button>
              <div className="mt-horas">
                {horas.map((h, k) => <button key={h} type="button" className="selecao-opcao" disabled={ocupadas?.has(k)} title={ocupadas?.has(k) ? "Linha ocupada" : undefined} onClick={feito(() => acoes.marcarHora(id, k))}>{h}</button>)}
              </div>
            </>
          )}
          {vista === "duracao" && (
            <>
              <button type="button" className="selecao-opcao mt-voltar" onClick={() => setVista("menu")}>‹ Voltar</button>
              <div className="mt-duracoes">
                {Array.from({ length: Math.floor(duracaoLimite / 30) }, (_, j) => (j + 1) * 30).map((m) => {
                  const cabe = m <= duracaoMax;
                  return (
                    <button key={m} type="button" className="selecao-opcao" disabled={!cabe} aria-pressed={duracao === m || undefined} onClick={feito(() => acoes.duracao(id, m))}>
                      {rotuloDuracao(m)}{!cabe && ocupadoAs && <span className="mt-ocupado">ocupado às {ocupadoAs}</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {vista === "excluir" && (
            <>
              <p className="mt-pergunta">Apagar esta tarefa? Ela some do calendário também.</p>
              <button type="button" className="selecao-opcao mt-perigo" onClick={feito(aoExcluir)}>
                <span className="selecao-opcao-rotulo">Apagar</span>
              </button>
              <button type="button" className="selecao-opcao" autoFocus onClick={() => setVista("menu")}>
                <span className="selecao-opcao-rotulo">Manter</span>
              </button>
            </>
          )}
          {vista === "criar" &&pessoas((q) => acoes.criarPara(id, q))}
          {vista === "empresa" && (
            <>
              <button type="button" className="selecao-opcao mt-voltar" onClick={() => setVista("menu")}>‹ Voltar</button>
              {empresas.map((e) => (
                <button key={e.id} type="button" className="selecao-opcao" aria-pressed={empresaId === e.id || undefined} onClick={feito(() => acoes.empresa(id, e.id))}>
                  <SeloEmpresa empresaId={e.id} nome={e.nome} tamanho={18} />
                  <span className="selecao-opcao-rotulo">{e.nome}</span>
                </button>
              ))}
              <button type="button" className="selecao-opcao" data-separar aria-pressed={!empresaId || undefined} onClick={feito(() => acoes.empresa(id, ""))}>
                <span className="selecao-opcao-rotulo">Nenhuma</span>
              </button>
            </>
          )}
          {vista === "pessoa" && pessoas((q) => acoes.marcarPessoa(id, q), responsavel)}
        </div>
      </div>
    </>
  );
}
