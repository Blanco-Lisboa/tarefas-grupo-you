"use client";
import type { Tarefa } from "@/lib/dados";
import { useSoltar, type Acoes } from "./Evento";
import { diasDoMes, nomeMes } from "./logica";

// Visão ANO: 12 mini-meses; quanto mais tarefas no dia, mais forte o roxo.
const LETRAS = ["D", "S", "T", "Q", "Q", "S", "S"];
const nivel = (n: number) => Math.min(n, 4);

export function Ano({ cursor, mapa, hoje, acoes }: { cursor: string; mapa: Map<string, Tarefa[]>; hoje: string; acoes: Acoes }) {
  const ano = cursor.slice(0, 4);
  const { marcado, alvo } = useSoltar(acoes.soltar);
  return (
    <div className="ano-janela">
      <div className="ano">
        {Array.from({ length: 12 }, (_, m) => {
          const primeiro = `${ano}-${String(m + 1).padStart(2, "0")}-01`;
          const chave = primeiro.slice(0, 7);
          const dias = diasDoMes(primeiro);
          const total = new Set(dias.filter((d) => d.startsWith(chave)).flatMap((d) => (mapa.get(d) ?? []).map((t) => t.id))).size;
          return (
            <section key={m} className="ano-mes" data-atual={hoje.startsWith(chave)}>
              <button type="button" className="ano-titulo" onClick={() => acoes.irPara("mes", primeiro)}>
                {nomeMes(primeiro)}
                <span>{total ? `${total} ${total === 1 ? "tarefa" : "tarefas"}` : ""}</span>
              </button>
              <div className="ano-dias">
                {LETRAS.map((l, i) => <span key={i} className="ano-letra">{l}</span>)}
                {dias.map((dia) => {
                  if (!dia.startsWith(chave)) return <span key={dia} />;
                  const n = mapa.get(dia)?.length ?? 0;
                  return (
                    <button
                      key={dia}
                      type="button"
                      className="ano-dia"
                      data-nivel={nivel(n)}
                      data-hoje={dia === hoje}
                      data-alvo={marcado === dia}
                      title={`${Number(dia.slice(8))} de ${nomeMes(dia).toLowerCase()}: ${n ? `${n} ${n === 1 ? "tarefa" : "tarefas"}` : "livre"}`}
                      onClick={() => acoes.irPara("dia", dia)}
                      {...alvo(dia, { dia })}
                    >
                      {Number(dia.slice(8))}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <p className="ano-legenda" aria-hidden>
        Menos {[0, 1, 2, 3, 4].map((n) => <span key={n} className="ano-dia" data-nivel={n} />)} Mais
      </p>
    </div>
  );
}
