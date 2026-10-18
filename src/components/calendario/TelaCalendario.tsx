"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { salvarTarefa, useTarefas, type NovaTarefa, type Tarefa } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { Ficha, tarefaEmBranco } from "@/components/ficha/Ficha";
import { Ano } from "./Ano";
import { Evento, useSoltar, type Acoes } from "./Evento";
import { BarraFiltros, passa, SEM_FILTROS, type Filtros } from "./Filtros";
import { Grade } from "./Grade";
import { andar, comMinuto, diasDaSemana, diasDoMes, mover, paraHora, porDia, tituloPeriodo, type Destino, type Visao } from "./logica";
import { Mes } from "./Mes";
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
          <button type="button" className="cal-botao" onClick={() => setCursor(hoje)} title="Hoje (T)">Hoje</button>
          <button type="button" className="cal-seta" onClick={() => setCursor(andar(visao, cursor, -1))} aria-label="Anterior">‹</button>
          <button type="button" className="cal-seta" onClick={() => setCursor(andar(visao, cursor, 1))} aria-label="Próximo">›</button>
        </div>
        <div className="cal-titulo">
          <h1>{titulo} <span className="destaque">{ano}</span></h1>
          <p>{noPeriodo ? `${noPeriodo} ${noPeriodo === 1 ? "tarefa" : "tarefas"} neste período` : "Nenhuma tarefa neste período"}</p>
        </div>
        <div className="cal-visoes" role="group" aria-label="Visão do calendário">
          {VISOES.map(({ v, rotulo, tecla }) => (
            <button key={v} type="button" aria-pressed={visao === v} onClick={() => setVisao(v)} title={`${rotulo} (${tecla.toUpperCase()})`}>{rotulo}</button>
          ))}
        </div>
        <button type="button" className="ficha-botao cal-nova" onClick={() => acoes.criar(null)}><span>+ Nova tarefa</span></button>
      </header>

      <BarraFiltros filtros={filtros} mudar={setFiltros} />

      <div className="cal-corpo">
        <div className="cal-painel-pai corte-sombra">
          <div className="cal-painel corte-22" data-visao={visao}>
            {(visao === "dia" || visao === "semana") && (
              <Grade key={visao} dias={visao === "dia" ? [cursor] : diasDaSemana(cursor)} mapa={mapa} agora={agora} acoes={acoes} />
            )}
            {visao === "mes" && <Mes cursor={cursor} mapa={mapa} hoje={hoje} acoes={acoes} />}
            {visao === "ano" && <Ano cursor={cursor} mapa={mapa} hoje={hoje} acoes={acoes} />}
          </div>
        </div>
        <SemData lista={semData} acoes={acoes} />
      </div>

      {aberta && <Ficha key={aberta.id ?? "nova"} tarefa={aberta} aoFechar={() => setAberta(null)} />}
    </section>
  );
}

function SemData({ lista, acoes }: { lista: Tarefa[]; acoes: Acoes }) {
  const { marcado, alvo } = useSoltar(acoes.soltar);
  return (
    <aside className="cal-semdata no-escuro corte-22" data-alvo={marcado === "sem-data"} {...alvo("sem-data", null)} aria-label="Tarefas sem data">
      <header>
        <h2>Sem <span className="destaque">data</span></h2>
        <span className="cal-semdata-total">{lista.length}</span>
      </header>
      <p>Arraste para um dia ou horário. Solte aqui para tirar a data.</p>
      <div className="cal-semdata-lista">
        {lista.map((t) => <Evento key={t.id} t={t} modo="cartao" abrir={acoes.abrir} />)}
        {!lista.length && <p className="cal-semdata-vazio">Nada sem data com estes filtros.</p>}
      </div>
      <button type="button" className="cal-semdata-nova" onClick={() => acoes.criar(null)}>+ Tarefa sem data</button>
    </aside>
  );
}
