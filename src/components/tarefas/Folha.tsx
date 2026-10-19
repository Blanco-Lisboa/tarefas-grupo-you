"use client";
import { useState, type CSSProperties } from "react";
import type { Responsavel } from "@/lib/dados";
import { Selecao } from "@/components/ui/Selecao";
import type { OpcaoLetra } from "./fontes";
import "./caderno.css";

export type LinhaFolha = { id: string; titulo: string; detalhe: string; feita: boolean };
type Opcao = { id: string; nome: string };

type Props = {
  letra: OpcaoLetra;
  titulo: string;
  subtitulo?: string;
  /** Uma entrada por linha da folha; null = linha vazia (onde se escreve). */
  linhas: (LinhaFolha | null)[];
  /** Texto da margem, por linha (o horário). */
  rotulos?: string[];
  vazio: string;
  empresas: Opcao[];
  empresaPadrao: string;
  /** Sem estes a folha é só para olhar (página de escolha da letra). */
  aoMarcar?: (id: string) => void;
  aoApagar?: (id: string) => void;
  aoAbrir?: (id: string) => void;
  aoEscrever?: (titulo: string, empresaId: string, responsavel: Responsavel, linha: number) => void;
};

// Giro mínimo e fixo por tarefa: a mão nunca escreve duas linhas idênticas.
const giro = (id: string) => (([...id].reduce((s, c) => s + c.charCodeAt(0), 0) % 7) - 3) * 0.12;

// Estouro do check (mesmas posições do CRM): 12 pontos de tinta e 4 riscos, só ao marcar.
const PONTOS = [[25, -25], [-25, -25], [25, 25], [-25, 25], [35, 0], [-35, 0], [0, 35], [0, -35], [20, -30], [-20, 30], [30, 20], [-30, -20]];

export function Folha({ letra, titulo, subtitulo, linhas, rotulos, vazio, empresas, empresaPadrao, aoMarcar, aoApagar, aoAbrir, aoEscrever }: Props) {
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [estourando, setEstourando] = useState<string | null>(null);
  const [texto, setTexto] = useState<{ linha: number; valor: string }>({ linha: -1, valor: "" });
  const [empresa, setEmpresa] = useState<string | null>(null);
  const [resp, setResp] = useState<Responsavel>("natham");
  const empresaAtual = empresa && empresas.some((e) => e.id === empresa) ? empresa : empresaPadrao;
  const primeiraVazia = linhas.findIndex((l) => !l);

  const marcar = (l: LinhaFolha) => {
    aoMarcar?.(l.id);
    if (!l.feita) { setEstourando(l.id); setTimeout(() => setEstourando(null), 700); }
  };

  return (
    <section className={`pag folha ${letra.fonte.className}`} style={{ "--escala": letra.escala } as CSSProperties}>
      <header className="pag-faixa">
        <h2 className="pag-faixa-titulo">{titulo}</h2>
        {subtitulo && <p className="pag-faixa-sub">{subtitulo}</p>}
      </header>

      <div className="pag-miolo">
        {aoEscrever && (
          <div className="folha-quem">
            <span className="folha-quem-rotulo">Nova tarefa em</span>
            <Selecao
              rotulo="Empresa" multipla={false} valor={[empresaAtual]} aoMudar={([v]) => v && setEmpresa(v)}
              opcoes={empresas.map((e) => ({ valor: e.id, rotulo: e.nome }))}
            />
            <Selecao
              rotulo="Responsável" multipla={false} valor={[resp]} aoMudar={([v]) => v && setResp(v as Responsavel)}
              opcoes={[{ valor: "natham", rotulo: "Natham" }, { valor: "matheus", rotulo: "Matheus" }]}
            />
          </div>
        )}

        <ul className="folha-linhas">
          {linhas.map((l, k) => (
            <li key={l?.id ?? `v${k}`} className="linha" data-feita={l?.feita}>
              <span className="linha-hora">{rotulos?.[k]}</span>
              {l ? (
                <div className="linha-miolo" style={{ transform: `rotate(${giro(l.id)}deg)` }}>
                  <button
                    type="button" className={`caixa${estourando === l.id ? " estourando" : ""}`} disabled={!aoMarcar} aria-pressed={l.feita}
                    aria-label={`${l.feita ? "Desmarcar" : "Marcar como feita"}: ${l.titulo}`}
                    onClick={() => marcar(l)}
                  >
                    <span className="caixa-brilho" aria-hidden="true" />
                    <svg viewBox="0 0 28 28" aria-hidden="true">
                      <path className="caixa-quadro" d="M5 6.5 L22.5 5 L23.2 22.6 L6 23.4 Z" />
                      <path className="caixa-visto" d="M8 14.5 L13 20 L25 4.5" />
                    </svg>
                    <span className="caixa-fx" aria-hidden="true">
                      {PONTOS.map(([x, y], i) => <i key={i} className="ponto" style={{ "--x": `${x}px`, "--y": `${y}px` } as CSSProperties} />)}
                      {[0, 90, 180, 270].map((r) => <i key={r} className="faisca" style={{ "--r": `${r}deg` } as CSSProperties} />)}
                    </span>
                  </button>
                  <span className="linha-texto">
                    <button type="button" className="abrir" disabled={!aoAbrir} title="Abrir a ficha" onClick={() => aoAbrir?.(l.id)}>
                      <span className="folha-tinta risco">{l.titulo}</span>
                    </button>
                    <span className="folha-lapis detalhe">{l.detalhe}</span>
                  </span>
                  {aoApagar && (confirmando === l.id ? (
                    <span className="confirmar folha-lapis">
                      Some do calendário também.
                      <button type="button" className="confirmar-sim folha-tinta" onClick={() => { aoApagar(l.id); setConfirmando(null); }}>Apagar</button>
                      <button type="button" className="confirmar-nao" autoFocus onClick={() => setConfirmando(null)}>Manter</button>
                    </span>
                  ) : (
                    <button type="button" className="apagar" aria-label={`Apagar: ${l.titulo}`} onClick={() => setConfirmando(l.id)}>
                      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
                    </button>
                  ))}
                </div>
              ) : aoEscrever ? (
                <form
                  className="linha-miolo"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const t = texto.valor.trim();
                    if (!t || !empresaAtual) return;
                    aoEscrever(t, empresaAtual, resp, k);
                    setTexto({ linha: -1, valor: "" });
                  }}
                >
                  <span className="caixa caixa-vazia" aria-hidden="true" />
                  <input
                    className="folha-tinta campo" value={texto.linha === k ? texto.valor : ""} maxLength={140}
                    onChange={(e) => setTexto({ linha: k, valor: e.target.value })}
                    placeholder={k === primeiraVazia ? (linhas.some(Boolean) ? "escreva e aperte Enter" : vazio) : undefined}
                    aria-label={`Nova tarefa${rotulos?.[k] ? `, ${rotulos[k]}` : ""}`}
                  />
                </form>
              ) : (
                <span className="linha-miolo linha-vazia">{k === primeiraVazia && !linhas.some(Boolean) ? <span className="folha-lapis">{vazio}</span> : null}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
