"use client";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { salvarTarefa, useTarefas, type NovaTarefa, type Tarefa } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { Ficha, tarefaEmBranco } from "@/components/ficha/Ficha";
import { Ano } from "./Ano";
import { Evento, useSoltar, type Acoes } from "./Evento";
import { BarraFiltros, passa, SEM_FILTROS, type Filtros } from "./Filtros";
import { Grade } from "./Grade";
import { andar, comMinuto, diasDaSemana, diasDoMes, mover, paraHora, porDia, tituloPeriodo, type Destino, type Visao } from "./logica";
import { Mes } from "./Mes";
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
  return { inicio: comMinuto(d.dia, d.minuto), fim: d.minuto < 23 * 60 ? comMinuto(d.dia, d.minuto + 60) : undefined };
}

function Calendario({ agora }: { agora: string }) {
  const hoje = agora.slice(0, 10);
  const [visao, setVisao] = useState<Visao>("semana");
  const [cursor, setCursor] = useState(hoje);
  const [filtros, setFiltros] = useState<Filtros>(SEM_FILTROS);
  const [aberta, setAberta] = useState<NovaTarefa | null>(null);
  const tarefas = useTarefas();
  const { aplicar, selecionadas } = useFiltroEmpresa();

  const visiveis = useMemo(() => aplicar(tarefas).filter(passa(filtros)), [aplicar, tarefas, filtros]);
  const mapa = useMemo(() => porDia(visiveis), [visiveis]);
  const semData = visiveis.filter((t) => !t.inicio);

  const acoes: Acoes = {
    abrir: setAberta,
    criar: (d) => setAberta(tarefaEmBranco({
      empresaId: selecionadas[0] ?? "",
      responsavel: filtros.responsavel.length === 1 ? (filtros.responsavel[0] as Tarefa["responsavel"]) : "natham",
      ...quando(d),
    })),
    soltar: (id, d) => {
      const t = tarefas.find((x) => x.id === id);
      if (t) void salvarTarefa(mover(t, d));
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
        <div className="cal-navega">
          <button type="button" className="btn btn-2" onClick={() => setCursor(hoje)} title="Hoje (T)">Hoje</button>
          <button type="button" className="btn btn-2 cal-seta cal-seta-volta" onClick={() => setCursor(andar(visao, cursor, -1))} aria-label="Anterior" title="Anterior (seta para a esquerda)">
            <svg className="seta" viewBox="0 0 24 24" aria-hidden><path d="M4 12h15M13 6l6 6-6 6" /></svg>
          </button>
          <button type="button" className="btn btn-2 cal-seta" onClick={() => setCursor(andar(visao, cursor, 1))} aria-label="Próximo" title="Próximo (seta para a direita)">
            <svg className="seta" viewBox="0 0 24 24" aria-hidden><path d="M4 12h15M13 6l6 6-6 6" /></svg>
          </button>
        </div>
        <div className="cal-titulo">
          <h1>{titulo} <span className="destaque">{ano}</span></h1>
          <p>{noPeriodo ? `${noPeriodo} ${noPeriodo === 1 ? "tarefa" : "tarefas"} neste período` : "Nenhuma tarefa neste período"}</p>
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

      <div className="cal-painel-pai corte-sombra">
        <div className="cal-painel corte-22" data-visao={visao}>
          {(visao === "dia" || visao === "semana") && (
            <Grade key={visao} dias={visao === "dia" ? [cursor] : diasDaSemana(cursor)} mapa={mapa} agora={agora} acoes={acoes} />
          )}
          {visao === "mes" && <Mes cursor={cursor} mapa={mapa} hoje={hoje} acoes={acoes} />}
          {visao === "ano" && <Ano cursor={cursor} mapa={mapa} hoje={hoje} acoes={acoes} />}
        </div>
      </div>

      {aberta && <Ficha key={aberta.id ?? "nova"} tarefa={aberta} aoFechar={() => setAberta(null)} />}
    </section>
  );
}

/** "Sem data" (item 39): botão com contador que abre a lista por cima do calendário. Mesmo visual do botão de seleção
    da base (reaproveita as classes de ui/selecao.css): campo da ID e lista em vidro roxo com orelhas, como o submenu do
    site da ID. Soltar uma tarefa NO BOTÃO tira a data dela. */
function SemData({ lista, acoes }: { lista: Tarefa[]; acoes: Acoes }) {
  const id = useId();
  const pop = useRef<HTMLDivElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const { marcado, alvo } = useSoltar(acoes.soltar);
  const ancora = `--semdata-${id.replace(/[^\w-]/g, "")}`;

  // Arrastar da lista: ela fica transparente e deixa o mouse passar, para soltar no calendário que está embaixo.
  // Fecha quando a tarefa cai (drop) ou o arrasto é cancelado (dragend); os dois chegam na janela.
  const comecar = () => {
    setTimeout(() => setArrastando(true)); // depois do navegador tirar a "foto" da tarefa arrastada
    const fim = () => {
      setArrastando(false);
      pop.current?.hidePopover();
      window.removeEventListener("drop", fim);
      window.removeEventListener("dragend", fim);
    };
    window.addEventListener("drop", fim);
    window.addEventListener("dragend", fim);
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
        <svg className="selecao-seta" viewBox="0 0 12 12" aria-hidden>
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
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
        <section className="cal-semdata corte-22 no-escuro" aria-label="Tarefas sem data">
          <h2>Sem <span className="destaque">data</span></h2>
          <p>Arraste uma tarefa para um dia ou horário. Para tirar a data, solte a tarefa no botão Sem data.</p>
          <div className="cal-semdata-lista">
            {lista.map((t) => <Evento key={t.id} t={t} modo="cartao" abrir={acoes.abrir} />)}
            {!lista.length && <p className="cal-semdata-vazio">Nada sem data com estes filtros.</p>}
          </div>
          <button type="button" className="btn btn-claro cal-semdata-nova" onClick={() => acoes.criar(null)}>+ Tarefa sem data</button>
        </section>
      </div>
    </>
  );
}
