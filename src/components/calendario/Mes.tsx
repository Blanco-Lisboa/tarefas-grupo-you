"use client";
import type { CSSProperties } from "react";
import type { Tarefa } from "@/lib/dados";
import { Evento, useSoltar, type Acoes } from "./Evento";
import { diasDoMes, nomeMes, nomeSemana } from "./logica";

// Visão MÊS: uma célula por dia, até 3 tarefas e "+N" para o resto (leva ao dia).
const CABEM = 3;

export function Mes({ cursor, mapa, hoje, acoes }: { cursor: string; mapa: Map<string, Tarefa[]>; hoje: string; acoes: Acoes }) {
  const dias = diasDoMes(cursor);
  const mes = cursor.slice(0, 7);
  const { marcado, alvo } = useSoltar(acoes.soltar);
  return (
    <div className="mes" style={{ "--semanas": dias.length / 7 } as CSSProperties}>
      {dias.slice(0, 7).map((d) => <div key={d} className="mes-semana">{nomeSemana(d)}</div>)}
      {dias.map((dia) => {
        const lista = mapa.get(dia) ?? [];
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
            {lista.slice(0, sobra > 0 ? CABEM - 1 : CABEM).map((t) => <Evento key={t.id} t={t} modo="chip" abrir={acoes.abrir} />)}
            {sobra > 0 && (
              <button type="button" className="mes-mais" onClick={() => acoes.irPara("dia", dia)}>+{sobra + 1} mais</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
