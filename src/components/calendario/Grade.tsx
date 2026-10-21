"use client";
import { useEffect, useId, useRef, type CSSProperties, type DragEvent, type MouseEvent } from "react";
import type { EventoAgenda, Tarefa } from "@/lib/dados";
import { Compromisso } from "./Compromisso";
import { CriarAqui, Evento, useSoltar, type Acoes } from "./Evento";
import { comMinuto, empilhar, eventoNoTopo, faixas, horaCurta, minutoDoDia, nomeSemana, variosDias } from "./logica";

// Visões DIA e SEMANA: grade de horários (1 hora = 48px), tarefas de dia inteiro no topo. Os compromissos do Google
// (item 190) entram na mesma grade, lado a lado com as tarefas quando o horário cruza. Na semana, as curtas do mesmo
// horário empilham na largura do dia (empilhar, Régua 215 v2) e o que não cabe vira "+N" com a lista.
const HORA = 48;
const PX = HORA / 60;
const HORAS = Array.from({ length: 24 }, (_, h) => h);

/** Minuto do dia sob o mouse, de 15 em 15. */
function minutoSob(e: MouseEvent<HTMLElement> | DragEvent<HTMLElement>) {
  const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
  return Math.min(Math.max(Math.floor(y / PX / 15) * 15, 0), 24 * 60 - 15);
}

type Props = { dias: string[]; mapa: Map<string, Tarefa[]>; agenda: Map<string, EventoAgenda[]>; agora: string; acoes: Acoes };

export function Grade({ dias, mapa, agenda, agora, acoes }: Props) {
  const rolagem = useRef<HTMLDivElement>(null);
  const { marcado, alvo } = useSoltar(acoes.soltar);
  const hoje = agora.slice(0, 10);

  useEffect(() => {
    if (rolagem.current) rolagem.current.scrollTop = 7 * HORA - 12; // abre às 7h, como o Google Agenda
  }, []);

  const doDia = (dia: string) => mapa.get(dia) ?? [];
  const daAgenda = (dia: string) => agenda.get(dia) ?? [];
  const noTopo = (t: Tarefa) => t.diaInteiro || variosDias(t);

  return (
    <div className="grade-janela">
      <div className="grade" data-dias={dias.length} style={{ "--colunas": dias.length } as CSSProperties}>
        <div className="grade-cabeca">
          <div className="grade-canto" />
          {dias.map((dia) => {
            const total = doDia(dia).length, compromissos = daAgenda(dia).length;
            return (
              <button key={dia} type="button" className="grade-dia" data-hoje={dia === hoje} onClick={() => acoes.irPara("dia", dia)} title="Ver só este dia">
                <span className="grade-dia-nome">{nomeSemana(dia)}</span>
                <span className="grade-dia-num">{Number(dia.slice(8, 10))}</span>
                <span className="grade-dia-total">{total ? `${total} ${total === 1 ? "tarefa" : "tarefas"}` : compromissos ? `${compromissos} ${compromissos === 1 ? "compromisso" : "compromissos"}` : "livre"}</span>
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
              <CriarAqui destino={{ dia, diaInteiro: true }} criar={acoes.criar} />
              {daAgenda(dia).filter(eventoNoTopo).map((e) => <Compromisso key={e.id} e={e} modo="chip" />)}
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
              const itens = faixas([
                ...doDia(dia).filter((t) => !noTopo(t)).map((t) => {
                  const ini = minutoDoDia(t.inicio!);
                  return { t, ini, fim: Math.max(t.fim ? minutoDoDia(t.fim) : ini + 30, ini + 30) };
                }),
                ...daAgenda(dia).filter((e) => !eventoNoTopo(e)).map((e) => {
                  const ini = minutoDoDia(e.inicio), fim = !e.fim ? ini + 30 : e.fim.slice(0, 10) > dia ? 24 * 60 : minutoDoDia(e.fim); // termina à meia-noite
                  return { e, ini, fim: Math.max(fim, ini + 30) };
                }),
              ]);
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
                  <CriarAqui destino={{ dia, minuto: 9 * 60 }} criar={acoes.criar} style={{ top: 9 * HORA + 4 }} />
                  {empilhar(itens, dias.length > 1).map((p) => {
                    const style = {
                      top: p.topo * PX, height: p.altura * PX - 2,
                      left: "mais" in p ? "2px" : `calc(${(p.faixa / p.total) * 100}% + 2px)`, width: "mais" in p ? "calc(100% - 4px)" : `calc(${100 / p.total}% - 4px)`,
                    };
                    if ("mais" in p) return <Mais key={`mais-${p.topo}`} itens={p.mais} abrir={acoes.abrir} style={style} />;
                    const { it } = p, curto = it.fim - it.ini <= 45;
                    return "e" in it
                      ? <Compromisso key={`g-${it.e.id}`} e={it.e} modo="bloco" curto={curto} style={style} />
                      : <Evento key={it.t.id} t={it.t} modo="bloco" curto={curto} abrir={acoes.abrir} style={style} />;
                  })}
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

/** "+N" das curtas do mesmo horário que não couberam na pilha: abre a lista com hora e nome inteiro; tarefa abre a ficha. */
function Mais({ itens, abrir, style }: { itens: ({ t: Tarefa } | { e: EventoAgenda })[]; abrir: Acoes["abrir"]; style: CSSProperties }) {
  const id = useId().replace(/[^\w-]/g, "");
  const lista = useRef<HTMLDivElement>(null);
  const nome = (x: { t: Tarefa } | { e: EventoAgenda }) => ("t" in x ? x.t.titulo : x.e.titulo);
  const hora = (x: { t: Tarefa } | { e: EventoAgenda }) => horaCurta("t" in x ? x.t.inicio! : x.e.inicio);
  return (
    <>
      <button type="button" className="grade-mais" popoverTarget={`mais-${id}`} aria-label={`Mais ${itens.length} às ${hora(itens[0])}`}
        style={{ ...style, anchorName: `--mais-${id}` } as CSSProperties} onClick={(e) => e.stopPropagation()}>
        +{itens.length} {itens.length === 1 ? "tarefa" : "tarefas"}
      </button>
      <div ref={lista} id={`mais-${id}`} popover="auto" className="selecao-pop" style={{ positionAnchor: `--mais-${id}` } as CSSProperties}>
        <div className="selecao-lista" role="group" aria-label={`Às ${hora(itens[0])}`}>
          {itens.map((x) => "t" in x
            ? <button key={x.t.id} type="button" className="selecao-opcao" onClick={() => { lista.current?.hidePopover(); abrir(x.t); }}><b>{hora(x)}</b> {nome(x)}</button>
            : <span key={x.e.id} className="selecao-opcao" title="Compromisso do Google (só leitura)"><b>{hora(x)}</b> {nome(x)}</span>)}
        </div>
      </div>
    </>
  );
}
