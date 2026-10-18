"use client";
import { useEffect, useRef, type CSSProperties, type DragEvent, type MouseEvent } from "react";
import type { Tarefa } from "@/lib/dados";
import { Evento, useSoltar, type Acoes } from "./Evento";
import { comMinuto, faixas, minutoDoDia, nomeSemana, variosDias } from "./logica";

// Visões DIA e SEMANA: grade de horários (1 hora = 48px), tarefas de dia inteiro no topo.
const HORA = 48;
const PX = HORA / 60;
const HORAS = Array.from({ length: 24 }, (_, h) => h);

/** Minuto do dia sob o mouse, de 15 em 15. */
function minutoSob(e: MouseEvent<HTMLElement> | DragEvent<HTMLElement>) {
  const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
  return Math.min(Math.max(Math.floor(y / PX / 15) * 15, 0), 24 * 60 - 15);
}

type Props = { dias: string[]; mapa: Map<string, Tarefa[]>; agora: string; acoes: Acoes };

export function Grade({ dias, mapa, agora, acoes }: Props) {
  const rolagem = useRef<HTMLDivElement>(null);
  const { marcado, alvo } = useSoltar(acoes.soltar);
  const hoje = agora.slice(0, 10);

  useEffect(() => {
    if (rolagem.current) rolagem.current.scrollTop = 7 * HORA - 12; // abre às 7h, como o Google Agenda
  }, []);

  const doDia = (dia: string) => mapa.get(dia) ?? [];
  const noTopo = (t: Tarefa) => t.diaInteiro || variosDias(t);

  return (
    <div className="grade-janela">
      <div className="grade" data-dias={dias.length} style={{ "--colunas": dias.length } as CSSProperties}>
        <div className="grade-cabeca">
          <div className="grade-canto" />
          {dias.map((dia) => {
            const total = doDia(dia).length;
            return (
              <button key={dia} type="button" className="grade-dia" data-hoje={dia === hoje} onClick={() => acoes.irPara("dia", dia)} title="Ver só este dia">
                <span className="grade-dia-nome">{nomeSemana(dia)}</span>
                <span className="grade-dia-num">{Number(dia.slice(8, 10))}</span>
                <span className="grade-dia-total">{total ? `${total} ${total === 1 ? "tarefa" : "tarefas"}` : "livre"}</span>
              </button>
            );
          })}
          <div className="grade-canto grade-canto-rotulo">Dia inteiro</div>
          {dias.map((dia) => (
            <div
              key={dia}
              className="grade-topo"
              data-alvo={marcado === `topo-${dia}`}
              onClick={(e) => e.target === e.currentTarget && acoes.criar({ dia, diaInteiro: true })}
              {...alvo(`topo-${dia}`, { dia, diaInteiro: true })}
            >
              {doDia(dia).filter(noTopo).map((t) => <Evento key={t.id} t={t} modo="chip" abrir={acoes.abrir} />)}
            </div>
          ))}
        </div>

        <div className="grade-rolagem" ref={rolagem}>
          <div className="grade-corpo">
            <div className="grade-horas" aria-hidden>
              {HORAS.map((h) => <span key={h} style={{ top: h * HORA }}>{h ? `${String(h).padStart(2, "0")}:00` : ""}</span>)}
            </div>
            {dias.map((dia) => {
              const itens = faixas(
                doDia(dia).filter((t) => !noTopo(t)).map((t) => {
                  const ini = minutoDoDia(t.inicio!);
                  return { t, ini, fim: Math.max(t.fim ? minutoDoDia(t.fim) : ini + 30, ini + 30) };
                }),
              );
              const fantasma = marcado?.startsWith(`${dia}T`) ? minutoDoDia(marcado) : null;
              return (
                <div
                  key={dia}
                  className="grade-coluna"
                  data-hoje={dia === hoje}
                  onClick={(e) => e.target === e.currentTarget && acoes.criar({ dia, minuto: minutoSob(e) })}
                  {...alvo(dia, (e) => {
                    const minuto = minutoSob(e);
                    return { chave: comMinuto(dia, minuto), destino: { dia, minuto } };
                  })}
                >
                  {itens.map(({ t, ini, fim, faixa, total }) => (
                    <Evento
                      key={t.id}
                      t={t}
                      modo="bloco"
                      curto={fim - ini <= 45}
                      abrir={acoes.abrir}
                      style={{
                        top: ini * PX, height: (fim - ini) * PX - 2,
                        left: `calc(${(faixa / total) * 100}% + 2px)`, width: `calc(${100 / total}% - 4px)`,
                      }}
                    />
                  ))}
                  {fantasma !== null && (
                    <div className="grade-fantasma" style={{ top: fantasma * PX, height: HORA }}>{comMinuto(dia, fantasma).slice(11)}</div>
                  )}
                  {dia === hoje && <div className="grade-agora" style={{ top: minutoDoDia(agora) * PX }} aria-label="Agora" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
