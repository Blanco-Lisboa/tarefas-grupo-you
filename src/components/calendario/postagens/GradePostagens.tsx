"use client";
import type { CSSProperties, MouseEvent } from "react";
import type { Ocorrencia } from "@/lib/dados";
import { DatasDoDia } from "../DatasDoDia";
import { faixas, minutoDoDia, nomeSemana } from "../logica";
import { Bloco } from "./Bloco";
import { MetasDoDia } from "./Metas";
import { HORAS as HORAS_FICHA } from "./logica";

// Semana das postagens na grade de horários das Tarefas (classes de calendario.css), mas só das 05:00 às 22:00 e esticada
// na altura da tela: tudo cabe sem rolar. Posições em % do período. Cada postagem ocupa 1 hora; as que se cruzam ficam lado a lado.
const INI = 5 * 60;
const FIM = 22 * 60;
const pct = (min: number) => `${((min - INI) / (FIM - INI)) * 100}%`;
const HORAS = Array.from({ length: (FIM - INI) / 60 }, (_, i) => INI / 60 + i);
const DURA = 60;

/** Horário sob o mouse, de meia em meia hora, dentro das horas que a ficha oferece. */
function horaSob(e: MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  const min = INI + Math.floor((((e.clientY - r.top) / r.height) * (FIM - INI)) / 30) * 30;
  const h = `${String(Math.floor(min / 60)).padStart(2, "0")}:${min % 60 ? "30" : "00"}`;
  return h < HORAS_FICHA[0] ? HORAS_FICHA[0] : h > HORAS_FICHA.at(-1)! ? HORAS_FICHA.at(-1)! : h;
}

type Props = {
  dias: string[]; mapa: Map<string, Ocorrencia[]>; agora: string;
  criar?: (dia: string, hora: string) => void; verCard: (id: string) => void; horaDoCard: (id: string) => string; abrir: (o: Ocorrencia) => ((o: Ocorrencia) => void) | undefined;
};

export function GradePostagens({ dias, mapa, agora, criar, verCard, horaDoCard, abrir }: Props) {
  const hoje = agora.slice(0, 10);
  const agoraMin = minutoDoDia(agora);
  // Meta do dia (sem hora) fica na faixa "Metas" do topo, como o "Dia inteiro" das Tarefas; com hora, na grade
  const metas = (dia: string) => (mapa.get(dia) ?? []).filter((o) => !o.hora);
  const temMeta = dias.some((d) => metas(d).length);

  return (
    <div className="grade-janela">
      <div className="grade pgrade" data-dias={dias.length} style={{ "--colunas": dias.length, "--horas": HORAS.length } as CSSProperties}>
        <div className="grade-cabeca">
          <div className="grade-canto" />
          {dias.map((dia) => {
            const total = mapa.get(dia)?.length ?? 0;
            return (
              <div key={dia} className="grade-dia" data-hoje={dia === hoje}>
                <span className="grade-dia-nome">{nomeSemana(dia)}</span>
                <span className="grade-dia-num">{Number(dia.slice(8, 10))}</span>
                <span className="grade-dia-total">{total ? `${total} ${total === 1 ? "postagem" : "postagens"}` : "nada para postar"}</span>
                <DatasDoDia dia={dia} />
              </div>
            );
          })}
          {temMeta && <div className="grade-canto grade-canto-rotulo">Metas</div>}
          {temMeta && dias.map((dia) => (
            <div key={dia} className="grade-topo pmetas">
              <MetasDoDia dia={dia} metas={metas(dia)} horaDoCard={horaDoCard} abrir={abrir} verCard={verCard} />
            </div>
          ))}
        </div>

        <div className="grade-rolagem">
          <div className="grade-corpo">
            <div className="grade-horas" aria-hidden>
              {HORAS.map((h) => <span key={h} style={{ top: pct(h * 60) }}>{`${String(h).padStart(2, "0")}:00`}</span>)}
            </div>
            {dias.map((dia) => {
              // O post que cumpriu uma meta aparece também na hora em que saiu (sem editar: a meta se edita pela etiqueta)
              const cumpriram = metas(dia).flatMap((o) => { const hora = o.cardId ? horaDoCard(o.cardId) : ""; return hora ? [{ ...o, hora, planejadaId: undefined }] : []; });
              const itens = faixas([...(mapa.get(dia) ?? []).filter((o) => o.hora), ...cumpriram].map((o) => {
                const ini = Math.min(Math.max(minutoDoDia(`${dia}T${o.hora}`), INI), FIM - 30); // post fora da grade (ex.: extra às 23h) fica na ponta
                return { o, ini, fim: Math.min(ini + DURA, FIM) };
              }));
              return (
                <div key={dia} className="grade-coluna" data-hoje={dia === hoje} data-criar={!!criar}
                  onClick={(e) => criar && e.target === e.currentTarget && criar(dia, horaSob(e))}>
                  {itens.map((p, i) => (
                    <div key={`${p.o.planejadaId ?? p.o.cardId}-${i}`} className="pgrade-item"
                      style={{ top: pct(p.ini), height: `calc(${pct(INI + p.fim - p.ini)} - 2px)`, left: `calc(${(p.faixa / p.total) * 100}% + 2px)`, width: `calc(${100 / p.total}% - 4px)` }}>
                      <Bloco o={p.o} modo="cartao" aoAbrir={abrir(p.o)} aoVerCard={verCard} />
                    </div>
                  ))}
                  {dia === hoje && agoraMin >= INI && agoraMin <= FIM && <div className="grade-agora" style={{ top: pct(agoraMin) }} aria-label="Agora" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
