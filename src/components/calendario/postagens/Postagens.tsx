"use client";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { podeAlterar, useEu, usePostagensCalendario, useTarefas, type Ocorrencia, type Planejada, type Tarefa } from "@/lib/dados";
import { Ficha } from "@/components/ficha/Ficha";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { FiltroEmpresa } from "@/components/casca/FiltroEmpresa";
import { CampoData } from "@/components/ui/CampoData";
import { Selecao } from "@/components/ui/Selecao";
import { quandoDe } from "@/lib/atraso";
import { Ano } from "../Ano";
import { DatasDoDia } from "../DatasDoDia";
import { nomeMes, nomeSemana, paraHora, tituloPeriodo, VISOES } from "../logica";
import { Navegar } from "../Navegar";
import { Bloco } from "./Bloco";
import { GradePostagens } from "./GradePostagens";
import { FichaPostagem } from "./FichaPostagem";
import { periodoDe, planejadaNova, porDiaPostagens, type Modo } from "./logica";
import "./postagens.css";

const CABEM = 3; // no mês, como nas tarefas: até 3 por dia e "+N mais"
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

type Aberta = { inicial: Planejada; ocorrencia?: Ocorrencia } | null;

/** 315 · Calendário de postagens: o que cada empresa tem de postar em cada dia. Só o Natham cria e muda; os outros veem. */
export function Postagens({ agora, trocador }: { agora: string; trocador: ReactNode }) {
  const hoje = agora.slice(0, 10);
  const [modo, setModo] = useState<Modo>("semana");
  const [cursor, setCursor] = useState(hoje);
  const [aberta, setAberta] = useState<Aberta>(null);
  const eu = useEu();
  const natham = eu === "natham";
  const tarefas = useTarefas();
  const [card, setCard] = useState<Tarefa | null>(null);
  // Hora em que o card saiu, pela mesma data do Mapa e do banco (quando_do_post): programada, início, ou quando foi para Postado
  const horaDoCard = (id: string) => {
    const t = tarefas.find((x) => x.id === id);
    const q = t && (quandoDe(t) || (t.postadoEm && paraHora(new Date(t.postadoEm))));
    return q ? q.slice(11, 16) : "";
  };
  const verCard = (id: string) => { const t = tarefas.find((x) => x.id === id); if (t) setCard(t); };
  const { aplicar } = useFiltroEmpresa();
  // No Ano não se busca o ano inteiro: a chamada fica na semana de hoje, a mesma que a tela já pediu (não vai ao banco de novo)
  const { dias, de, ate } = modo === "ano" ? periodoDe("semana", hoje) : periodoDe(modo, cursor);
  const { itens } = usePostagensCalendario(de, ate);
  const [ultimo, setUltimo] = useState<Ocorrencia[]>([]);
  if (itens && itens !== ultimo) setUltimo(itens); // trocando de semana, a anterior fica na tela até a nova chegar (sem piscar)
  const visiveis = useMemo(() => aplicar(itens ?? ultimo), [aplicar, itens, ultimo]);
  const mapa = useMemo(() => porDiaPostagens(visiveis), [visiveis]);

  const [titulo, ano] = tituloPeriodo(modo, cursor);
  const doPeriodo = modo === "mes" ? visiveis.filter((o) => o.dia.startsWith(cursor.slice(0, 7))) : visiveis;
  const conta = (e: Ocorrencia["estado"]) => doPeriodo.filter((o) => o.estado === e).length;
  const resumo = doPeriodo.length
    ? [conta("planejada") && plural(conta("planejada"), "planejada", "planejadas"), conta("feita") && plural(conta("feita"), "postada", "postadas"),
      conta("faltou") && `${conta("faltou")} faltou`, conta("extra") && plural(conta("extra"), "extra", "extras")].filter(Boolean).join(" · ")
    : "Nenhuma postagem";

  const criar = (dia: string, hora?: string) => setAberta({ inicial: { ...planejadaNova(dia), ...(hora && { hora }) } });
  const editar = (o: Ocorrencia) => o.planejadaId && setAberta({ inicial: planejadaNova(o.dia), ocorrencia: o });
  const abrir = (o: Ocorrencia) => (natham && o.planejadaId ? () => editar(o) : undefined);
  const irPara = (v: Modo, dia: string) => { setModo(v); setCursor(dia); };

  return (
    <section className="cal pcal">
      <header className="cal-barra">
        <div className="cal-titulo">
          <h1>
            <CampoData rotulo="Ir para a data" valor={cursor} aoMudar={(d) => d && setCursor(d)} semLimpar
              titulo={titulo ? <span>{titulo} <span className="cal-titulo-ano">{ano}</span></span> : <span>{ano}</span>} />
          </h1>
          {modo !== "ano" && <p>{resumo}</p>}
        </div>
        <FiltroEmpresa />
        <div className="cal-acoes">
          {trocador}
          <Navegar visao={modo} cursor={cursor} hoje={hoje} aoMudar={setCursor} />
          <Selecao rotulo="Visão" multipla={false} opcoes={VISOES.map(({ v, rotulo }) => ({ valor: v, rotulo }))} valor={[modo]} aoMudar={(n) => n[0] && setModo(n[0] as Modo)} />
          {natham && <button type="button" className="btn cal-nova" onClick={() => criar(dias.includes(hoje) ? hoje : modo === "mes" ? `${cursor.slice(0, 7)}-01` : dias[0])}>+ Postagem</button>}
        </div>
      </header>

      <div className="cal-painel-pai">
        <div className="cal-painel" data-visao={modo}>
          {modo === "ano" ? (
            <Ano cursor={cursor} hoje={hoje} irPara={irPara} />
          ) : modo !== "mes" ? (
            <GradePostagens key={modo} dias={dias} mapa={mapa} agora={agora} abrir={abrir} verCard={verCard} horaDoCard={horaDoCard} criar={natham ? criar : undefined} />
          ) : (
            <div className="mes pmes" style={{ "--semanas": dias.length / 7 } as CSSProperties}>
              {dias.slice(0, 7).map((d) => <div key={d} className="mes-semana">{nomeSemana(d)}</div>)}
              {dias.map((dia) => {
                const lista = mapa.get(dia) ?? [];
                const sobra = lista.length - CABEM;
                const n = Number(dia.slice(8, 10));
                return (
                  <div key={dia} className="mes-celula" data-fora={dia.slice(0, 7) !== cursor.slice(0, 7)} data-hoje={dia === hoje} data-criar={natham}
                    onClick={(e) => natham && e.target === e.currentTarget && criar(dia)}>
                    <button type="button" className="mes-numero" onClick={() => irPara("semana", dia)} title="Ver a semana">{n === 1 ? `1 de ${nomeMes(dia).slice(0, 3).toLowerCase()}` : n}</button>
                    <DatasDoDia dia={dia} />
                    {lista.slice(0, sobra > 0 ? CABEM - 1 : CABEM).map((o, i) => <Bloco key={`${o.planejadaId ?? o.cardId}-${i}`} o={o} modo="chip" aoAbrir={abrir(o)} />)}
                    {sobra > 0 && <button type="button" className="mes-mais" onClick={() => irPara("semana", dia)}>+{sobra + 1} mais</button>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {card && <Ficha key={card.id} tarefa={card} tipos={["roteiro", "gravacao", "edicao", "postagem"]} aoFechar={() => setCard(null)} soLer={!podeAlterar(card, eu)} />}
      {aberta && <FichaPostagem key={aberta.ocorrencia ? `${aberta.ocorrencia.planejadaId}-${aberta.ocorrencia.dia}` : "nova"} inicial={aberta.inicial} ocorrencia={aberta.ocorrencia} aoFechar={() => setAberta(null)} />}
    </section>
  );
}
