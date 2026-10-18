"use client";
import { useState, type CSSProperties } from "react";
import type { Responsavel } from "@/lib/dados";
import type { OpcaoLetra } from "./fontes";
import "./caderno.css";

export type LinhaFolha = { id: string; titulo: string; detalhe: string; feita: boolean };
type Opcao = { id: string; nome: string };

type Props = {
  letra: OpcaoLetra;
  titulo: string;
  subtitulo?: string;
  linhas: LinhaFolha[];
  vazio: string;
  empresas: Opcao[];
  empresaPadrao: string;
  /** Sem estes três a folha é só para olhar (página de escolha da letra). */
  aoMarcar?: (id: string) => void;
  aoApagar?: (id: string) => void;
  aoAbrir?: (id: string) => void;
  aoEscrever?: (titulo: string, empresaId: string, responsavel: Responsavel) => void;
};

const MIN_LINHAS = 13;
// Giro mínimo e fixo por tarefa: a mão nunca escreve duas linhas idênticas.
const giro = (id: string) => (([...id].reduce((s, c) => s + c.charCodeAt(0), 0) % 7) - 3) * 0.12;

export function Folha({ letra, titulo, subtitulo, linhas, vazio, empresas, empresaPadrao, aoMarcar, aoApagar, aoAbrir, aoEscrever }: Props) {
  const [texto, setTexto] = useState("");
  const [empresa, setEmpresa] = useState<string | null>(null);
  const [resp, setResp] = useState<Responsavel>("natham");
  const empresaAtual = empresa && empresas.some((e) => e.id === empresa) ? empresa : empresaPadrao;
  const sobra = Math.max(0, MIN_LINHAS - linhas.length - 1);

  return (
    <section className={`folha ${letra.fonte.className}`} style={{ "--escala": letra.escala } as CSSProperties}>
      <header className="folha-cabeca">
        <h2 className="folha-titulo">{titulo}</h2>
        <svg className="folha-sublinhado" viewBox="0 0 300 10" preserveAspectRatio="none" aria-hidden="true">
          <path d="M2 6 C40 2 70 9 120 5 S210 3 298 6" />
        </svg>
        {subtitulo && <p className="folha-sub">{subtitulo}</p>}
      </header>

      <ul className="folha-linhas">
        {linhas.length === 0 && (
          <li className="linha linha-vazia"><span className="folha-lapis">{vazio}</span></li>
        )}
        {linhas.map((l) => (
          <li key={l.id} className="linha" data-feita={l.feita}>
            <div className="linha-miolo" style={{ transform: `rotate(${giro(l.id)}deg)` }}>
              <button
                type="button" className="caixa" disabled={!aoMarcar} aria-pressed={l.feita}
                aria-label={`${l.feita ? "Desmarcar" : "Marcar como feita"}: ${l.titulo}`}
                onClick={() => aoMarcar?.(l.id)}
              >
                <svg viewBox="0 0 28 28" aria-hidden="true">
                  <path className="caixa-quadro" d="M5 6.5 L22.5 5 L23.2 22.6 L6 23.4 Z" />
                  <path className="caixa-visto" d="M8 14.5 L13 20 L25 4.5" />
                </svg>
              </button>
              <span className="linha-texto">
                <button type="button" className="abrir" disabled={!aoAbrir} title="Abrir a ficha" onClick={() => aoAbrir?.(l.id)}>
                  <span className="folha-tinta risco">{l.titulo}</span>
                </button>
                <span className="folha-lapis detalhe">{l.detalhe}</span>
              </span>
              {aoApagar && (
                <button type="button" className="apagar" aria-label={`Apagar: ${l.titulo}`} onClick={() => aoApagar(l.id)}>
                  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4 L16 16 M16 3.5 L4.5 16.5" /></svg>
                </button>
              )}
            </div>
          </li>
        ))}

        {aoEscrever && (
          <li className="linha linha-nova">
            <form
              className="linha-miolo"
              onSubmit={(e) => {
                e.preventDefault();
                const t = texto.trim();
                if (!t || !empresaAtual) return;
                aoEscrever(t, empresaAtual, resp);
                setTexto("");
              }}
            >
              <span className="caixa caixa-lapis" aria-hidden="true">+</span>
              <input
                className="folha-tinta campo" value={texto} onChange={(e) => setTexto(e.target.value)}
                placeholder="escreva e aperte Enter" aria-label="Nova tarefa" maxLength={140}
              />
              <select className="folha-lapis escolha" value={empresaAtual} onChange={(e) => setEmpresa(e.target.value)} aria-label="Empresa da nova tarefa">
                {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
              <select className="folha-lapis escolha" value={resp} onChange={(e) => setResp(e.target.value as Responsavel)} aria-label="Responsável pela nova tarefa">
                <option value="natham">Natham</option>
                <option value="matheus">Matheus</option>
              </select>
            </form>
          </li>
        )}
        {Array.from({ length: sobra }, (_, i) => <li key={`v${i}`} className="linha" aria-hidden="true" />)}
      </ul>
    </section>
  );
}
