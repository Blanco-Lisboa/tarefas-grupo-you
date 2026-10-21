"use client";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { podeAlterar, salvarTarefa, useAgendaEventos, useEu, useTarefas, type NovaTarefa, type Tarefa } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { Ficha, tarefaEmBranco } from "@/components/ficha/Ficha";
import { Ano } from "./Ano";
import { Evento, useSoltar, type Acoes } from "./Evento";
import { BarraFiltros, passa, passaEvento, SEM_FILTROS, type Filtros } from "./Filtros";
import { Grade } from "./Grade";
import { agendaPorDia, andar, comMinuto, diasDaSemana, diasDoMes, esperarFimDoArraste, mover, paraHora, porDia, tituloPeriodo, type Destino, type Visao } from "./logica";
import { Mes } from "./Mes";
import { FiltroEmpresa } from "@/components/casca/FiltroEmpresa";
import { daMinhaLista } from "@/components/tarefas/grade";
import { Selecao } from "@/components/ui/Selecao";
import "./calendario.css";

// Relógio local, atualizado a cada 30s. No servidor é null: a tela só desenha no navegador (o "hoje" é o do computador).
const assinarRelogio = (f: () => void) => { const id = setInterval(f, 30_000); return () => clearInterval(id); };
const lerRelogio = () => paraHora(new Date());
const useAgora = () => useSyncExternalStore(assinarRelogio, lerRelogio, () => null);

const VISOES: { v: Visao; rotulo: string; tecla: string }[] = [
  { v: "dia", rotulo: "Dia", tecla: "d" },
  { v: "semana", rotulo: "Semana", tecla: "s" },
  { v: "mes", rotulo: "Mês", tecla: "m" },
  { v: "ano", rotulo: "Ano", tecla: "a" },
];

export function TelaCalendario() {
  const agora = useAgora();
  return agora ? <Calendario agora={agora} /> : <section className="cal" aria-busy="true" />;
}

/** Data/hora de uma tarefa nova criada clicando num lugar vazio. */
function quando(d: Destino): Partial<NovaTarefa> {
  if (!d) return {};
  if (d.minuto === undefined) return { inicio: d.dia, diaInteiro: true };
  return { inicio: comMinuto(d.dia, d.minuto) }; // nasce sem fim (item 159): bloco de 30 min
}

function Calendario({ agora }: { agora: string }) {
  const hoje = agora.slice(0, 10);
  const [visao, setVisao] = useState<Visao>("semana");
  const [cursor, setCursor] = useState(hoje);
  const [filtros, setFiltros] = useState<Filtros>(SEM_FILTROS);
  const [aberta, setAberta] = useState<NovaTarefa | null>(null);
  const eu = useEu();
  // A mesma regra do Caderno, compartilhada com Conteúdos e Mapa.
  const todas = useTarefas();
  const tarefas = useMemo(() => todas.filter((t) => daMinhaLista(t, eu)), [todas, eu]);
  const { aplicar } = useFiltroEmpresa();

  const visiveis = useMemo(() => aplicar(tarefas).filter(passa(filtros)), [aplicar, tarefas, filtros]);
  const mapa = useMemo(() => porDia(visiveis), [visiveis]);
  const semData = visiveis.filter((t) => !t.inicio);
  // Compromissos do Google (item 190), só leitura. O banco já entrega só as agendas que a pessoa pode ver.
  const eventos = useAgendaEventos();
  const agenda = useMemo(() => agendaPorDia(eventos.filter(passaEvento(filtros))), [eventos, filtros]);

  const acoes: Acoes = {
    abrir: setAberta,
    criar: (d) => setAberta(tarefaEmBranco({
      empresaId: "", // item 217: nasce sem empresa, nem com o filtro ligado; só vira card da Esteira se a pessoa escolher a empresa
      responsavel: filtros.responsavel.length === 1 ? (filtros.responsavel[0] as Tarefa["responsavel"]) : eu ?? "natham", // quem está logado, como no Caderno (item 155)
      ...quando(d),
      vaiProGoogle: true, // item 192: nasceu no Calendário; ao salvar, a Ficha só mantém se tiver data e a regra do R5-3 deixar (vaiProGoogle da logica)
    })),
    soltar: (id, d) => {
      const t = tarefas.find((x) => x.id === id);
      if (t && podeAlterar(t, eu)) void salvarTarefa(mover(t, d));
    },
    irPara: (v, dia) => { setVisao(v); setCursor(dia); },
  };

  // Atalhos como no Google Agenda: D S M A troca a visão, T volta para hoje, setas andam.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (e.ctrlKey || e.metaKey || e.altKey || alvo.closest("input, select, textarea, dialog")) return;
      const k = e.key.toLowerCase();
      const v = VISOES.find((x) => x.tecla === k);
      if (v) setVisao(v.v);
      else if (k === "t") setCursor(hoje);
      else if (e.key === "ArrowLeft" || e.key === "ArrowRight") setCursor((c) => andar(visao, c, e.key === "ArrowLeft" ? -1 : 1));
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [hoje, visao]);

  const periodo = visao === "dia" ? [cursor] : visao === "semana" ? diasDaSemana(cursor)
    : visao === "mes" ? diasDoMes(cursor).filter((d) => d.startsWith(cursor.slice(0, 7))) : null;
  const noPeriodo = new Set(
    [...mapa].filter(([d]) => (periodo ? periodo.includes(d) : d.startsWith(cursor.slice(0, 4)))).flatMap(([, l]) => l.map((t) => t.id)),
  ).size;
  const [titulo, ano] = tituloPeriodo(visao, cursor);

  return (
    <section className="cal">
      <header className="cal-barra">
        <div className="cal-quem">
          <div className="cal-titulo">
            <h1>{titulo ? <>{titulo} <span className="cal-titulo-ano">{ano}</span></> : ano}</h1>
            <p>{noPeriodo ? `${noPeriodo} ${noPeriodo === 1 ? "tarefa" : "tarefas"} neste período` : "Nenhuma tarefa neste período"}</p>
          </div>
          <FiltroEmpresa />
        </div>
        <div className="cal-navega">
          <button type="button" className="btn btn-2" onClick={() => setCursor(hoje)} title="Hoje (T)">Hoje</button>
          <button type="button" className="btn btn-2 cal-seta cal-seta-volta" onClick={() => setCursor(andar(visao, cursor, -1))} aria-label="Anterior" title="Anterior (seta para a esquerda)">
            <svg className="seta" viewBox="0 0 24 24" aria-hidden><path d="M4 12h15M13 6l6 6-6 6" /></svg>
          </button>
          <button type="button" className="btn btn-2 cal-seta" onClick={() => setCursor(andar(visao, cursor, 1))} aria-label="Próximo" title="Próximo (seta para a direita)">
            <svg className="seta" viewBox="0 0 24 24" aria-hidden><path d="M4 12h15M13 6l6 6-6 6" /></svg>
          </button>
        </div>
        <button type="button" className="btn cal-nova" onClick={() => acoes.criar(null)}>+ Nova tarefa</button>
      </header>

      <div className="cal-linha-filtros">
        <BarraFiltros filtros={filtros} mudar={setFiltros} />
        <div className="cal-acoes">
          <SemData lista={semData} acoes={acoes} />
          <Selecao
            rotulo="Visão"
            multipla={false}
            opcoes={VISOES.map(({ v, rotulo }) => ({ valor: v, rotulo }))}
            valor={[visao]}
            aoMudar={(n) => n[0] && setVisao(n[0] as Visao)}
          />
        </div>
      </div>

      <div className="cal-painel-pai">
        <div className="cal-painel" data-visao={visao}>
          {(visao === "dia" || visao === "semana") && (
            <Grade key={visao} dias={visao === "dia" ? [cursor] : diasDaSemana(cursor)} mapa={mapa} agenda={agenda} agora={agora} acoes={acoes} />
          )}
          {visao === "mes" && <Mes cursor={cursor} mapa={mapa} agenda={agenda} hoje={hoje} acoes={acoes} />}
          {visao === "ano" && <Ano cursor={cursor} mapa={mapa} hoje={hoje} acoes={acoes} />}
        </div>
      </div>

      {aberta && <Ficha key={aberta.id ?? "nova"} tarefa={aberta} aoFechar={() => setAberta(null)} soLer={!!aberta.id && !podeAlterar(aberta as Tarefa, eu)} />}
    </section>
  );
}

/** "Sem data" (item 39): botão com contador que abre a lista por cima do calendário. Mesmo visual do botão de seleção
    da base (reaproveita as classes de ui/selecao.css), com a lista em vidro como a da seleção.
    Soltar uma tarefa NO BOTÃO tira a data dela. */
function SemData({ lista, acoes }: { lista: Tarefa[]; acoes: Acoes }) {
  const id = useId();
  const pop = useRef<HTMLDivElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const { marcado, alvo } = useSoltar(acoes.soltar);
  const ancora = `--semdata-${id.replace(/[^\w-]/g, "")}`;

  // Arrastar da lista: ela fica transparente e deixa o mouse passar, para soltar no calendário que está embaixo.
  // Fecha quando a tarefa cai (drop) ou o arrasto é cancelado (dragend); os dois chegam na janela.
  // Se a tela sair no meio do arraste, para de esperar (os ouvintes não ficam presos na janela).
  const parar = useRef<() => void>(undefined);
  useEffect(() => () => parar.current?.(), []);
  const comecar = () => {
    setTimeout(() => setArrastando(true)); // depois do navegador tirar a "foto" da tarefa arrastada
    parar.current?.();
    parar.current = esperarFimDoArraste(window, () => {
      setArrastando(false);
      pop.current?.hidePopover();
    });
  };

  return (
    <>
      <button
        type="button"
        className="selecao-botao cal-semdata-botao"
        popoverTarget={`${id}-lista`}
        data-alvo={marcado === "sem-data"}
        title="Tarefas sem data. Solte aqui uma tarefa do calendário para tirar a data dela."
        style={{ anchorName: ancora } as CSSProperties}
        {...alvo("sem-data", null)}
      >
        <span>Sem data</span>
        {lista.length > 0 && <span className="selecao-contador">{lista.length}</span>}
        <svg className="selecao-seta" viewBox="0 0 24 24" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        ref={pop}
        id={`${id}-lista`}
        popover="auto"
        className="selecao-pop cal-semdata-pop"
        data-arrastando={arrastando}
        style={{ positionAnchor: ancora } as CSSProperties}
        onDragStart={comecar}
      >
        <section className="cal-semdata" aria-label="Tarefas sem data">
          <h2>Sem data</h2>
          <p>Arraste uma tarefa para um dia ou horário. Para tirar a data, solte a tarefa no botão Sem data.</p>
          <div className="cal-semdata-lista">
            {lista.map((t) => <Evento key={t.id} t={t} modo="cartao" abrir={acoes.abrir} />)}
            {!lista.length && <p className="cal-semdata-vazio">Nada sem data com estes filtros.</p>}
          </div>
          <button type="button" className="btn btn-2 cal-semdata-nova" onClick={() => acoes.criar(null)}>+ Tarefa sem data</button>
        </section>
      </div>
    </>
  );
}
