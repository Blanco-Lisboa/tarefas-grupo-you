"use client";
import type { CSSProperties } from "react";
import type { EventoAgenda, Tarefa } from "@/lib/dados";
import { Compromisso } from "./Compromisso";
import { CriarAqui, Evento, useSoltar, type Acoes } from "./Evento";
import { diasDoMes, eventoNoTopo, nomeMes, nomeSemana, variosDias } from "./logica";

// Visão MÊS: uma célula por dia, até 3 itens (tarefas e compromissos do Google, por hora) e "+N" para o resto (leva ao dia).
const CABEM = 3;

type Props = { cursor: string; mapa: Map<string, Tarefa[]>; agenda: Map<string, EventoAgenda[]>; hoje: string; acoes: Acoes };

export function Mes({ cursor, mapa, agenda, hoje, acoes }: Props) {
  const dias = diasDoMes(cursor);
  const mes = cursor.slice(0, 7);
  const { marcado, alvo } = useSoltar(acoes.soltar);
  return (
    <div className="mes" style={{ "--semanas": dias.length / 7 } as CSSProperties}>
      {dias.slice(0, 7).map((d) => <div key={d} className="mes-semana">{nomeSemana(d)}</div>)}
      {dias.map((dia) => {
        // dia inteiro primeiro, depois por hora; a ordem que cada lista já tinha se mantém (sort estável)
        const lista = [
          ...(agenda.get(dia) ?? []).map((e) => ({ k: eventoNoTopo(e) ? "" : e.inicio, el: <Compromisso key={`g-${e.id}`} e={e} modo="chip" /> })),
          ...(mapa.get(dia) ?? []).map((t) => ({ k: t.diaInteiro || variosDias(t) ? "" : t.inicio!, el: <Evento key={t.id} t={t} modo="chip" abrir={acoes.abrir} /> })),
        ].sort((a, b) => a.k.localeCompare(b.k));
        const sobra = lista.length - CABEM;
        const n = Number(dia.slice(8, 10));
        return (
          <div
            key={dia}
            className="mes-celula"
            data-fora={dia.slice(0, 7) !== mes}
            data-hoje={dia === hoje}
            data-alvo={marcado === dia}
            onClick={(e) => e.target === e.currentTarget && acoes.criar({ dia })}
            {...alvo(dia, { dia })}
          >
            <button type="button" className="mes-numero" onClick={() => acoes.irPara("dia", dia)} title="Ver o dia">
              {n === 1 ? `1 de ${nomeMes(dia).slice(0, 3).toLowerCase()}` : n}
            </button>
            <CriarAqui destino={{ dia }} criar={acoes.criar} />
            {lista.slice(0, sobra > 0 ? CABEM - 1 : CABEM).map((x) => x.el)}
            {sobra > 0 && (
              <button type="button" className="mes-mais" onClick={() => acoes.irPara("dia", dia)}>+{sobra + 1} mais</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
