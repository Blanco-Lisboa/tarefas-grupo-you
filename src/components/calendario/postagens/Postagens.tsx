"use client";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useEu, usePostagensCalendario, type Ocorrencia, type Planejada } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { FiltroEmpresa } from "@/components/casca/FiltroEmpresa";
import { CampoData } from "@/components/ui/CampoData";
import { Selecao } from "@/components/ui/Selecao";
import { andar, diaCurto, nomeMes, nomeSemana, tituloPeriodo } from "../logica";
import { Bloco } from "./Bloco";
import { FichaPostagem } from "./FichaPostagem";
import { periodoDe, planejadaNova, porDiaPostagens, type Modo } from "./logica";
import "./postagens.css";

const VISOES: { v: Modo; rotulo: string }[] = [{ v: "semana", rotulo: "Semana" }, { v: "mes", rotulo: "Mês" }];
const CABEM = 3; // no mês, como nas tarefas: até 3 por dia e "+N mais"
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

type Aberta = { inicial: Planejada; ocorrencia?: Ocorrencia } | null;

/** 315 · Calendário de postagens: o que cada empresa tem de postar em cada dia. Só o Natham cria e muda; os outros veem. */
export function Postagens({ agora, trocador }: { agora: string; trocador: ReactNode }) {
  const hoje = agora.slice(0, 10);
  const [modo, setModo] = useState<Modo>("semana");
  const [cursor, setCursor] = useState(hoje);
  const [aberta, setAberta] = useState<Aberta>(null);
  const natham = useEu() === "natham";
  const { aplicar } = useFiltroEmpresa();
  const { dias, de, ate } = periodoDe(modo, cursor);
  const { itens } = usePostagensCalendario(de, ate);
  const [ultimo, setUltimo] = useState<Ocorrencia[]>([]);
  if (itens && itens !== ultimo) setUltimo(itens); // trocando de semana, a anterior fica na tela até a nova chegar (sem piscar)
  const visiveis = useMemo(() => aplicar(itens ?? ultimo), [aplicar, itens, ultimo]);
  const mapa = useMemo(() => porDiaPostagens(visiveis), [visiveis]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement).closest("input, select, textarea, dialog")) return;
      const k = e.key.toLowerCase();
      if (k === "s") setModo("semana");
      else if (k === "m") setModo("mes");
      else if (k === "t") setCursor(hoje);
      else if (e.key === "ArrowLeft" || e.key === "ArrowRight") setCursor((c) => andar(modo, c, e.key === "ArrowLeft" ? -1 : 1));
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [hoje, modo]);

  const [titulo, ano] = tituloPeriodo(modo, cursor);
  const doPeriodo = visiveis.filter((o) => (modo === "semana" ? true : o.dia.startsWith(cursor.slice(0, 7))));
  const conta = (e: Ocorrencia["estado"]) => doPeriodo.filter((o) => o.estado === e).length;
  const resumo = doPeriodo.length
    ? [conta("planejada") && plural(conta("planejada"), "planejada", "planejadas"), conta("feita") && plural(conta("feita"), "postada", "postadas"),
      conta("faltou") && `${conta("faltou")} faltou`, conta("extra") && plural(conta("extra"), "extra", "extras")].filter(Boolean).join(" · ")
    : "Nenhuma postagem";

  const criar = (dia: string) => setAberta({ inicial: planejadaNova(dia) });
  const editar = (o: Ocorrencia) => o.planejadaId && setAberta({ inicial: planejadaNova(o.dia), ocorrencia: o });
  const abrir = (o: Ocorrencia) => (natham && o.planejadaId ? () => editar(o) : undefined);
  const irPara = (dia: string) => { setModo("semana"); setCursor(dia); };

  return (
    <section className="cal pcal">
      <header className="cal-barra">
        <div className="cal-titulo">
          <h1>
            <CampoData rotulo="Ir para a data" valor={cursor} aoMudar={(d) => d && setCursor(d)} semLimpar
              titulo={titulo ? <span>{titulo} <span className="cal-titulo-ano">{ano}</span></span> : <span>{ano}</span>} />
          </h1>
          <p>{resumo}</p>
        </div>
        <FiltroEmpresa />
        <div className="cal-acoes">
          {trocador}
          <Selecao rotulo="Visão" multipla={false} opcoes={VISOES.map(({ v, rotulo }) => ({ valor: v, rotulo }))} valor={[modo]} aoMudar={(n) => n[0] && setModo(n[0] as Modo)} />
          {natham && <button type="button" className="btn cal-nova" onClick={() => criar(dias.includes(hoje) ? hoje : modo === "semana" ? dias[0] : `${cursor.slice(0, 7)}-01`)}>+ Postagem</button>}
        </div>
      </header>

      <div className="cal-painel-pai">
        <div className="cal-painel" data-visao={modo}>
          {modo === "semana" ? (
            <div className="psemana" style={{ "--colunas": dias.length } as CSSProperties}>
              {dias.map((dia) => (
                <div key={dia} className="psemana-dia" data-hoje={dia === hoje}>
                  <div className="grade-dia" data-hoje={dia === hoje}>
                    <span className="grade-dia-nome">{nomeSemana(dia)}</span>
                    <span className="grade-dia-num">{Number(dia.slice(8, 10))}</span>
                  </div>
                  <div className="psemana-lista">
                    {(mapa.get(dia) ?? []).map((o, i) => <Bloco key={`${o.planejadaId ?? o.cardId}-${i}`} o={o} modo="cartao" aoAbrir={abrir(o)} />)}
                    {!mapa.get(dia) && <p className="psemana-vazio">Nada para postar</p>}
                    {natham && <button type="button" className="psemana-nova" onClick={() => criar(dia)} aria-label={`Nova postagem em ${diaCurto(dia)}`}>+ Postagem</button>}
                  </div>
                </div>
              ))}
            </div>
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
                    <button type="button" className="mes-numero" onClick={() => irPara(dia)} title="Ver a semana">{n === 1 ? `1 de ${nomeMes(dia).slice(0, 3).toLowerCase()}` : n}</button>
                    {lista.slice(0, sobra > 0 ? CABEM - 1 : CABEM).map((o, i) => <Bloco key={`${o.planejadaId ?? o.cardId}-${i}`} o={o} modo="chip" aoAbrir={abrir(o)} />)}
                    {sobra > 0 && <button type="button" className="mes-mais" onClick={() => irPara(dia)}>+{sobra + 1} mais</button>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {aberta && <FichaPostagem key={aberta.ocorrencia ? `${aberta.ocorrencia.planejadaId}-${aberta.ocorrencia.dia}` : "nova"} inicial={aberta.inicial} ocorrencia={aberta.ocorrencia} aoFechar={() => setAberta(null)} />}
    </section>
  );
}
