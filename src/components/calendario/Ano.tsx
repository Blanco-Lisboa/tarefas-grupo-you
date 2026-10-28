"use client";
import type { Tarefa } from "@/lib/dados";
import type { HTMLAttributes } from "react";
import { useBalao } from "./Balao";
import { datasDoDia } from "./datas";
import { useSoltar, type Acoes } from "./Evento";
import { inicioSemana, nomeMes, semanaDoAno, somarDias } from "./logica";

// Visão ANO, como a do Google Agenda: 12 mini-meses de 6 semanas cada (os dias do mês vizinho em tom apagado, sem clique),
// com o número da semana à esquerda. Quanto mais tarefas no dia, mais forte o azul; sem `mapa` (Postagens) não conta nada.
// Data importante: o número ganha um anel na cor do tipo (destaque, feriado, comemorativa) e o balão de vidro diz qual é.
const LETRAS = ["D", "S", "T", "Q", "Q", "S", "S"];
const nivel = (n: number) => Math.min(n, 4);
const nada = () => {};

type Props = { cursor: string; hoje: string; irPara: Acoes["irPara"]; mapa?: Map<string, Tarefa[]>; soltar?: Acoes["soltar"] };

export function Ano({ cursor, hoje, irPara, mapa, soltar }: Props) {
  const ano = cursor.slice(0, 4);
  const { marcado, alvo } = useSoltar(soltar ?? nada);
  return (
    <div className="ano-janela">
      <div className="ano">
        {Array.from({ length: 12 }, (_, m) => {
          const primeiro = `${ano}-${String(m + 1).padStart(2, "0")}-01`;
          const chave = primeiro.slice(0, 7);
          const dias = Array.from({ length: 42 }, (_, i) => somarDias(inicioSemana(primeiro), i));
          const total = mapa ? new Set(dias.filter((d) => d.startsWith(chave)).flatMap((d) => (mapa.get(d) ?? []).map((t) => t.id))).size : 0;
          return (
            <section key={m} className="ano-mes" data-atual={hoje.startsWith(chave)}>
              <button type="button" className="ano-titulo" onClick={() => irPara("mes", primeiro)}>
                {nomeMes(primeiro)}
                <span>{total ? `${total} ${total === 1 ? "tarefa" : "tarefas"}` : ""}</span>
              </button>
              <div className="ano-dias">
                <span />
                {LETRAS.map((l, i) => <span key={i} className="ano-letra">{l}</span>)}
                {dias.flatMap((dia, i) => {
                  const semana = i % 7 === 0 ? [<span key={`s-${dia}`} className="ano-semana" title={`Semana ${semanaDoAno(dia)}`}>{semanaDoAno(dia)}</span>] : [];
                  if (!dia.startsWith(chave)) return [...semana, <span key={dia} className="ano-dia" data-fora aria-hidden>{Number(dia.slice(8))}</span>];
                  return [
                    ...semana,
                    <DiaDoAno key={dia} dia={dia} n={mapa ? mapa.get(dia)?.length ?? 0 : undefined} hoje={hoje} alvoAgora={marcado === dia}
                      irPara={irPara} soltavel={soltar && alvo(dia, { dia })} />,
                  ];
                })}
              </div>
            </section>
          );
        })}
      </div>
      <div className="ano-legenda">
        <p className="ano-legenda-datas">
          <span className="ano-dia" data-data="feriado" aria-hidden /> Feriado
          <span className="ano-dia" data-data="comemorativa" aria-hidden /> Data comemorativa
          <span className="ano-dia" data-data="destaque" aria-hidden /> Destaque
        </p>
        {mapa && (
          <p aria-hidden>
            Menos {[0, 1, 2, 3, 4].map((n) => <span key={n} className="ano-dia" data-nivel={n} />)} Mais
          </p>
        )}
      </div>
    </div>
  );
}

type PropsDia = { dia: string; n?: number; hoje: string; alvoAgora: boolean; irPara: Acoes["irPara"]; soltavel?: HTMLAttributes<HTMLButtonElement> };

/** Um dia do mês no Ano. Com data importante, o balão substitui o title; sem data, fica o title com o total de tarefas. */
function DiaDoAno({ dia, n, hoje, alvoAgora, irPara, soltavel }: PropsDia) {
  const datas = datasDoDia(dia);
  const nome = `${Number(dia.slice(8))} de ${nomeMes(dia).toLowerCase()}`;
  const tarefas = n === undefined ? undefined : n ? `${n} ${n === 1 ? "tarefa" : "tarefas"}` : "Livre";
  const { gatilho, elemento } = useBalao(dia, datas, tarefas);
  return (
    <button
      type="button"
      className="ano-dia"
      data-nivel={n === undefined ? undefined : nivel(n)}
      data-hoje={dia === hoje}
      data-alvo={alvoAgora}
      data-data={datas[0]?.tipo}
      title={datas.length ? undefined : tarefas ? `${nome}: ${tarefas.toLowerCase()}` : nome}
      onClick={() => irPara("dia", dia)}
      {...soltavel}
      {...(datas.length ? gatilho : {})}
    >
      {Number(dia.slice(8))}
      {datas.length > 0 && elemento}
    </button>
  );
}
