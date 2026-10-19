"use client";
import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useEmpresas, useTarefas, type NovaTarefa, type Rede, type Tarefa } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { Ficha, NOMES } from "@/components/ficha/Ficha";
import { diaCurto, nomeMes, nomeSemana } from "@/components/calendario/logica";
import { INICIO, conteudos, diasDoPeriodo, foiPostado, objetivoDe, porDia, postadosNoMes, semanas } from "./logica";
import "./mapa.css";

const DIAS = diasDoPeriodo();
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

// Geometria da conexão 06 "Quadro com ramos" (prancha da ID, seção 08), na escala de tela de trabalho.
const CW = 340, CH = 148, PASSO = CH + 16, MARGEM = 28, GAP_MIN = 96, GAP_MAX = 240;
const RAIO_ANEL = 8;
const ICONE_REDE: Record<Rede, string> = {
  instagram: "instagram-liso", youtube: "marcas/youtube-liso", tiktok: "marcas/tiktok-liso", kwai: "video-liso",
};
const icone = (nome: string) => `/beec/icones/${nome}.svg`;

export function TelaMapa() {
  const tarefas = useTarefas();
  const { aplicar } = useFiltroEmpresa();
  const [aberta, setAberta] = useState<NovaTarefa | null>(null);

  const todos = useMemo(() => conteudos(aplicar(tarefas)), [aplicar, tarefas]);
  const dias = useMemo(() => porDia(todos, DIAS), [todos]);
  const noPeriodo = [...dias.values()].flat();
  const aPostar = noPeriodo.filter((t) => !foiPostado(t)).sort((a, b) => a.inicio!.localeCompare(b.inicio!));
  const proximo = aPostar[0];
  const proximoDia = proximo?.inicio?.slice(0, 10);

  return (
    <section className="mapa">
      <header className="mapa-titulo">
        <h1>Mapa de <span className="destaque">{nomeMes(INICIO).toLowerCase()}</span></h1>
        <p>
          De {diaCurto(INICIO)} a {diaCurto(DIAS.at(-1)!)}.{" "}
          {noPeriodo.length ? `${plural(noPeriodo.length, "conteúdo", "conteúdos")} com data de postagem.` : "Nenhum conteúdo com data de postagem neste período."}
        </p>
      </header>

      <div className="mapa-resumo-pai corte-sombra-escuro">
        <dl className="mapa-resumo no-escuro corte-22">
          <div><dt>A postar</dt><dd>{aPostar.length}</dd></div>
          <div><dt>Já postados no mês</dt><dd>{postadosNoMes(todos)}</dd></div>
          <div><dt>Próxima postagem</dt><dd className="mapa-resumo-data">{proximoDia ? `${nomeSemana(proximoDia)}, ${diaCurto(proximoDia)}` : "Nenhuma"}</dd></div>
        </dl>
      </div>

      {noPeriodo.length ? (
        <div className="mapa-quadros">
          {semanas(DIAS).map((s, i) => {
            const lista = s.dias.flatMap((d) => dias.get(d) ?? []);
            return lista.length
              ? <Quadro key={s.inicio} numero={i + 1} de={s.dias[0]} ate={s.dias.at(-1)!} lista={lista} proximoId={proximo?.id} abrir={setAberta} />
              : <p key={s.inicio} className="mapa-semana-vazia">Semana {i + 1}, {diaCurto(s.dias[0])} a {diaCurto(s.dias.at(-1)!)}: nenhum conteúdo com data.</p>;
          })}
        </div>
      ) : (
        <p className="mapa-vazio">Nada para mostrar com os filtros de agora. Crie uma tarefa do tipo Postagem no calendário e ela aparece aqui.</p>
      )}

      {aberta && <Ficha key={(aberta as Tarefa).id} tarefa={aberta} aoFechar={() => setAberta(null)} />}
    </section>
  );
}

/** Largura do quadro, para as cordas abrirem e fecharem em toda a tela (no celular o quadro rola de lado). */
function useLargura() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(3 * CW + 2 * GAP_MIN);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ler = () => setW(Math.max(el.clientWidth, 3 * CW + 2 * GAP_MIN));
    ler();
    const o = new ResizeObserver(ler);
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return [ref, w] as const;
}

/** Uma semana = uma conexão 06: a semana entra (roxo), abre nos conteúdos (kraft) e fecha no resultado (roxo). */
function Quadro({ numero, de, ate, lista, proximoId, abrir }: {
  numero: number; de: string; ate: string; lista: Tarefa[]; proximoId?: string; abrir: (t: Tarefa) => void;
}) {
  const [ref, W] = useLargura();
  const n = lista.length;
  const postados = lista.filter(foiPostado).length;
  const pilha = n * PASSO - 16;
  const H = pilha + 2 * MARGEM;
  const cy = H / 2;
  const gap = Math.min((W - 3 * CW) / 2, GAP_MAX);
  const x0 = (W - (3 * CW + 2 * gap)) / 2, x1 = x0 + CW + gap, x2 = x1 + CW + gap;
  const topoCanal = (i: number) => MARGEM + i * PASSO;
  const yCanal = (i: number) => topoCanal(i) + CH / 2;
  const corda = (ax: number, ay: number, bx: number, by: number) => {
    const o = (bx - ax) * 0.36;
    return `M${ax} ${ay} C${ax + o} ${ay} ${bx - o} ${by} ${bx} ${by}`;
  };
  const acesa = lista.findIndex((t) => t.id === proximoId);
  const proxima = acesa >= 0 ? lista[acesa] : undefined;

  const corpos: { x: number; y: number; tipo: "entrada" | "canal" | "saida" }[] = [
    { x: x0, y: cy - CH / 2, tipo: "entrada" },
    ...lista.map((_, i) => ({ x: x1, y: topoCanal(i), tipo: "canal" as const })),
    { x: x2, y: cy - CH / 2, tipo: "saida" },
  ];
  const indices = [...lista.keys()];

  return (
    <figure className="fr v5">
      <div className="fr-in" ref={ref}>
        <div className="fr-tela" style={{ width: W, height: H }}>
          <svg className="cx" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Semana ${numero}: ${plural(n, "conteúdo", "conteúdos")}`}>
            {indices.map((i) => <path key={`e${i}`} className={`corda${i === acesa ? " acesa" : ""}`} d={corda(x0 + CW, cy, x1, yCanal(i))} />)}
            {indices.map((i) => <path key={`s${i}`} className={`corda${i === acesa ? " acesa" : ""}`} d={corda(x1 + CW, yCanal(i), x2, cy)} />)}
            {corpos.map((c, i) => (
              <Fragment key={i}>
                <rect className={`corpo r-${c.tipo}`} x={c.x} y={c.y} width={CW} height={CH} rx={5} />
                <polygon className={`faixa r-${c.tipo}`} points={`${c.x + 13},${c.y} ${c.x + CW - 10},${c.y} ${c.x + CW - 13},${c.y + 8} ${c.x + 10},${c.y + 8}`} />
              </Fragment>
            ))}
            <Anel x={x0 + CW} y={cy} acesa={acesa >= 0} />
            <Anel x={x2} y={cy} acesa={acesa >= 0} />
            {indices.map((i) => {
              const feito = foiPostado(lista[i]);
              return (
                <Fragment key={i}>
                  <Anel x={x1} y={yCanal(i)} acesa={i === acesa} feito={feito} />
                  <Anel x={x1 + CW} y={yCanal(i)} acesa={i === acesa} feito={feito} />
                </Fragment>
              );
            })}
          </svg>

          <Cartao x={x0} y={cy - CH / 2} tipo="entrada" icone="calendario-claro" rotulo={`Semana ${numero}`} titulo={`${diaCurto(de)} a ${diaCurto(ate)}`} texto={plural(n, "conteúdo com data", "conteúdos com data")} />
          {lista.map((t, i) => <Canal key={t.id} t={t} x={x1} y={topoCanal(i)} abrir={abrir} />)}
          <Cartao
            x={x2} y={cy - CH / 2} tipo="saida" icone="grafico-claro" rotulo="Resultado"
            titulo={postados === n ? "Tudo postado" : `${postados} de ${n} postados`}
            texto={proxima ? `A próxima sai ${nomeSemana(proxima.inicio!.slice(0, 10)).toLowerCase()}, ${diaCurto(proxima.inicio!.slice(0, 10))}` : postados === n ? "Nada pendente nesta semana" : `${plural(n - postados, "conteúdo", "conteúdos")} a postar`}
          />
        </div>
      </div>
    </figure>
  );
}

const Anel = ({ x, y, acesa, feito }: { x: number; y: number; acesa?: boolean; feito?: boolean }) => (
  <circle className={`anel${acesa ? " acesa" : ""}${feito ? " feito" : ""}`} cx={x} cy={y} r={RAIO_ANEL} />
);

const posicao = (x: number, y: number): CSSProperties => ({ left: x, top: y, width: CW, height: CH });

function Cartao({ x, y, tipo, icone: arq, rotulo, titulo, texto }: { x: number; y: number; tipo: string; icone: string; rotulo: string; titulo: string; texto: string }) {
  return (
    <div className={`tx r-${tipo}`} style={posicao(x, y)}>
      <p className="k-cv">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ic" src={icone(arq)} alt="" />
        <span className="n k-cvn">{rotulo}</span>
      </p>
      <p className="k-t4">{titulo}</p>
      <p className="k-x4">{texto}</p>
    </div>
  );
}

function Canal({ t, x, y, abrir }: { t: Tarefa; x: number; y: number; abrir: (t: Tarefa) => void }) {
  const empresa = useEmpresas().find((e) => e.id === t.empresaId)?.nome ?? "Sem empresa";
  const dia = t.inicio!.slice(0, 10);
  const feito = foiPostado(t);
  return (
    <button type="button" className="tx r-canal tx-botao" style={posicao(x, y)} onClick={() => abrir(t)}>
      <span className="k-cv">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ic" src={icone(t.rede ? ICONE_REDE[t.rede] : "anuncio-liso")} alt="" />
        <span className="n k-cvn">{t.rede ? NOMES.rede[t.rede] : "Sem rede"}{feito && <b> · postado</b>}</span>
      </span>
      <span className="k-t4">{objetivoDe(t)}</span>
      <span className="k-x4">{nomeSemana(dia)}, {diaCurto(dia)} · {empresa}</span>
    </button>
  );
}
