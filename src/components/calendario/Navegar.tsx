"use client";
import { andar, type Visao } from "./logica";

/** [Hoje] [‹] [›] dos dois calendários (Tarefas e Postagens), ao lado do filtro Visão. ‹ › andam um dia, semana, mês ou ano. */
export function Navegar({ visao, cursor, hoje, aoMudar }: { visao: Visao; cursor: string; hoje: string; aoMudar: (dia: string) => void }) {
  return (
    <div className="cal-navegar">
      <button type="button" className="btn btn-2" onClick={() => aoMudar(hoje)} aria-label="Ir para hoje">Hoje</button>
      <button type="button" className="btn btn-2 cal-seta" onClick={() => aoMudar(andar(visao, cursor, -1))} aria-label="Anterior" title="Anterior">‹</button>
      <button type="button" className="btn btn-2 cal-seta" onClick={() => aoMudar(andar(visao, cursor, 1))} aria-label="Próximo" title="Próximo">›</button>
    </div>
  );
}
