"use client";
import { Fragment, useEffect, useState, type CSSProperties } from "react";
import type { Tarefa } from "@/lib/dados";
import type { OpcaoLetra } from "./fontes";
import { horaDe, minutos, somarMinutos } from "./grade";
import "./caderno.css";

type Props = {
  letra: OpcaoLetra;
  /** Dia mostrado, "AAAA-MM-DD". */
  dia: string;
  hoje: string;
  /** Texto do canto da faixa (a data por extenso). */
  rotuloDia: string;
  /** Tarefas do dia, já ordenadas por hora. */
  tarefas: Tarefa[];
  /** Tarefas do dia seguinte (a lista "Para amanhã"). */
  amanha: Tarefa[];
  nomeEmpresa: (id: string) => string;
  aoAbrir: (id: string) => void;
};

const dois = (n: number) => String(n).padStart(2, "0");

// Anotação solta do dia: fica só neste navegador (a Fase 2 leva para o banco).
function useNota(chave: string) {
  const [valor, setValor] = useState(() => { try { return localStorage.getItem(chave) ?? ""; } catch { return ""; } });
  const mudar = (v: string) => { setValor(v); try { localStorage.setItem(chave, v); } catch {} };
  return [valor, mudar] as const;
}

export function Agenda({ letra, dia, hoje, rotuloDia, tarefas, amanha, nomeEmpresa, aoAbrir }: Props) {
  const [notas, setNotas] = useNota(`grade:caderno:${dia}:notas`);
  const [lembrar, setLembrar] = useNota(`grade:caderno:${dia}:lembrar`);
  // "Agora" só existe no navegador de quem abre: começa vazio e preenche depois (evita diferença de fuso).
  const [agora, setAgora] = useState<number | null>(null);
  useEffect(() => {
    const ler = () => { const d = new Date(); setAgora(d.getHours() * 60 + d.getMinutes()); };
    ler();
    const t = setInterval(ler, 60_000);
    return () => clearInterval(t);
  }, []);

  const comHora = tarefas.filter((t) => horaDe(t));
  const diaInteiro = tarefas.filter((t) => !horaDe(t));
  const ehHoje = dia === hoje;
  const fimDe = (t: Tarefa) => (t.fim && t.fim.length >= 16 ? t.fim.slice(11, 16) : somarMinutos(horaDe(t), 30));
  const passou = (t: Tarefa) => dia < hoje || (ehHoje && agora !== null && minutos(fimDe(t)) <= agora);
  const linhaAgora = ehHoje && agora !== null ? agora : null;
  const antesDoAgora = (t: Tarefa) => linhaAgora !== null && minutos(horaDe(t)) <= linhaAgora;
  const marcador = (
    <li className="ag-agora" aria-label="Agora">
      <span className="ag-agora-hora">{dois(Math.floor((linhaAgora ?? 0) / 60))}:{dois((linhaAgora ?? 0) % 60)}</span>
      <span className="ag-agora-linha" />
    </li>
  );
  // O marcador entra antes da primeira tarefa que ainda não começou (ou no fim, se todas já começaram).
  const posAgora = linhaAgora === null ? -1 : comHora.findIndex((t) => !antesDoAgora(t));

  const card = (t: Tarefa) => (
    <li className="ag-item" data-passou={passou(t) || !!t.concluida}>
      <span className="ag-hora folha-lapis">{horaDe(t)}</span>
      <span className="ag-trilho" aria-hidden="true"><span className="ag-ponto" style={{ borderColor: `var(--${t.cor})` }} /></span>
      <button type="button" className="ag-card" style={{ "--etq": `var(--${t.cor})` } as CSSProperties} onClick={() => aoAbrir(t.id)}>
        <span className="ag-textos">
          <span className="ag-nome folha-tinta" data-feita={!!t.concluida}>{t.titulo}</span>
          <span className="ag-info folha-lapis">{horaDe(t)} a {fimDe(t)} · {t.responsavel === "natham" ? "Natham" : "Matheus"}</span>
        </span>
        <span className="ag-selo" style={{ "--etq": `var(--${t.cor})`, color: `var(--${t.cor}-texto)` } as CSSProperties}>{nomeEmpresa(t.empresaId)}</span>
      </button>
    </li>
  );

  return (
    <section className={`pag agenda ${letra.fonte.className}`} style={{ "--escala": letra.escala } as CSSProperties}>
      <header className="pag-faixa">
        <h2 className="pag-faixa-titulo">Agenda do dia</h2>
        <p className="pag-faixa-sub">{rotuloDia}</p>
      </header>

      <div className="pag-miolo">
        {diaInteiro.length > 0 && (
          <div className="ag-dia-inteiro">
            <span className="ag-bloco-titulo">Dia inteiro</span>
            {diaInteiro.map((t) => (
              <button key={t.id} type="button" className="ag-inteiro" style={{ "--etq": `var(--${t.cor})` } as CSSProperties} onClick={() => aoAbrir(t.id)}>
                <span className="folha-tinta ag-nome" data-feita={!!t.concluida}>{t.titulo}</span>
                <span className="ag-selo" style={{ "--etq": `var(--${t.cor})`, color: `var(--${t.cor}-texto)` } as CSSProperties}>{nomeEmpresa(t.empresaId)}</span>
              </button>
            ))}
          </div>
        )}

        {comHora.length === 0 && diaInteiro.length === 0 ? (
          <div className="ag-vazio">
            <strong className="folha-tinta">Dia livre na agenda</strong>
            <p className="folha-lapis">Nenhuma tarefa neste dia. Escreva uma na linha de um horário e ela aparece aqui.</p>
          </div>
        ) : (
          <ol className="ag-lista">
            {comHora.map((t, i) => <Fragment key={t.id}>{posAgora === i && marcador}{card(t)}</Fragment>)}
            {linhaAgora !== null && posAgora === -1 && comHora.length > 0 && marcador}
          </ol>
        )}

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
