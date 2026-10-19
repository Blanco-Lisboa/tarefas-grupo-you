"use client";
import { useState, type CSSProperties } from "react";
import type { Tarefa } from "@/lib/dados";
import type { OpcaoLetra } from "./fontes";
import { notaDaChave, type Armazem, type EstadoNota } from "./notas";
import "./caderno.css";

type Props = {
  letra: OpcaoLetra;
  /** Dia mostrado, "AAAA-MM-DD". */
  dia: string;
  /** Texto do canto da faixa (a data por extenso). */
  rotuloDia: string;
  /** Tarefas do dia seguinte (a lista "Para amanhã"). */
  amanha: Tarefa[];
};

const armazem = (): Armazem => { try { return localStorage; } catch { return { getItem: () => null, setItem: () => {} }; } };
function useNota(chave: string) {
  const [estado, setEstado] = useState<EstadoNota | null>(null);
  const atual = notaDaChave(estado, chave, armazem()); // trocou o dia: lê a nota do dia novo, nunca mostra a do anterior
  const mudar = (valor: string) => { setEstado({ chave, valor }); try { localStorage.setItem(chave, valor); } catch {} };
  return [atual.valor, mudar] as const;
}

export function Agenda({ letra, dia, rotuloDia, amanha }: Props) {
  const [notas, setNotas] = useNota(`grade:caderno:${dia}:notas`);
  const [lembrar, setLembrar] = useNota(`grade:caderno:${dia}:lembrar`);
  return (
    <section className={`pag agenda ${letra.fonte.className}`} style={{ "--escala": letra.escala } as CSSProperties}>
      <header className="pag-faixa">
        <h2 className="pag-faixa-titulo">Agenda do dia</h2>
        <p className="pag-faixa-sub">{rotuloDia}</p>
      </header>

      <div className="pag-miolo">
        <div className="ag-vazio">
          <svg className="ag-vazio-icone" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" />
          </svg>
          <strong className="folha-tinta">Sua agenda do Google aparece aqui</strong>
          <p className="folha-lapis">Os compromissos marcados no Google Agenda ficarão neste lado do caderno.</p>
        </div>

        <div className="ag-blocos">
          <label className="ag-bloco ag-bloco-notas">
            <span className="ag-bloco-titulo">Anotações do dia</span>
            <textarea className="ag-texto folha-tinta" rows={3} maxLength={4000} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Escreva o que quiser lembrar deste dia…" />
          </label>
          <div className="ag-bloco">
            <span className="ag-bloco-titulo">Para amanhã</span>
            <ul className="ag-amanha folha-tinta">
              {amanha.length ? amanha.map((t) => <li key={t.id}>{t.titulo}</li>) : <li className="folha-lapis">Nada ainda.</li>}
            </ul>
          </div>
          <label className="ag-bloco">
            <span className="ag-bloco-titulo">Não esquecer</span>
            <textarea className="ag-texto folha-tinta" rows={3} maxLength={4000} value={lembrar} onChange={(e) => setLembrar(e.target.value)} placeholder="Recados soltos, que não são tarefa…" />
          </label>
        </div>
      </div>
    </section>
  );
}
