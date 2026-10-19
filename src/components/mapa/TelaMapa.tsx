"use client";
import { Fragment, useMemo, useState, type CSSProperties } from "react";
import { useEmpresas, useTarefas, type NovaTarefa, type Tarefa } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { Ficha, NOMES } from "@/components/ficha/Ficha";
import { diaCurto, nomeMes, nomeSemana } from "@/components/calendario/logica";
import { INICIO, conteudos, diasDoPeriodo, foiPostado, objetivoDe, porDia, postadosNoMes, semanas } from "./logica";
import "./mapa.css";

const DIAS = diasDoPeriodo();
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const corte = { "--card-corte": "28px" } as CSSProperties;

export function TelaMapa() {
  const tarefas = useTarefas();
  const { aplicar } = useFiltroEmpresa();
  const [aberta, setAberta] = useState<NovaTarefa | null>(null);

  const todos = useMemo(() => conteudos(aplicar(tarefas)), [aplicar, tarefas]);
  const dias = useMemo(() => porDia(todos, DIAS), [todos]);
  const noPeriodo = [...dias.values()].flat();
  const aPostar = noPeriodo.filter((t) => !foiPostado(t)).sort((a, b) => a.inicio!.localeCompare(b.inicio!));
  const proximo = aPostar[0]?.inicio?.slice(0, 10);

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
        <dl className="mapa-resumo no-escuro corte-22" style={corte}>
          <div><dt>A postar</dt><dd>{aPostar.length}</dd></div>
          <div><dt>Já postados no mês</dt><dd>{postadosNoMes(todos)}</dd></div>
          <div><dt>Próxima postagem</dt><dd className="mapa-resumo-data">{proximo ? `${nomeSemana(proximo)}, ${diaCurto(proximo)}` : "Nenhuma"}</dd></div>
        </dl>
      </div>

      <div className="mapa-painel-pai corte-sombra">
        <div className="mapa-painel corte-22" style={corte}>
          {noPeriodo.length
            ? <Linha dias={dias} abrir={setAberta} />
            : <p className="mapa-vazio">Nada para mostrar com os filtros de agora. Crie uma tarefa do tipo Postagem no calendário e ela aparece aqui.</p>}
        </div>
      </div>

      {aberta && <Ficha key={(aberta as Tarefa).id} tarefa={aberta} aoFechar={() => setAberta(null)} />}
    </section>
  );
}

/** A linha do tempo. Dois desenhos do mesmo dado: faixa horizontal (computador) e lista vertical (celular), trocados por CSS. */
function Linha({ dias, abrir }: { dias: Map<string, Tarefa[]>; abrir: (t: Tarefa) => void }) {
  const grupos = semanas(DIAS);
  // Nós alternam em cima e embaixo para os cartões largos não se sobreporem.
  const lados = new Map([...dias.keys()].sort().map((d, i) => [d, i % 2 ? "baixo" : "cima"] as const));
  return (
    <>
      <div className="mapa-rolagem">
        <div className="mapa-h" style={{ "--dias": DIAS.length } as CSSProperties}>
          {grupos.map((s, i) => {
            const n = s.dias.reduce((soma, d) => soma + (dias.get(d)?.length ?? 0), 0);
            return (
              <div key={s.inicio} className="mapa-semana" style={{ gridColumn: `${DIAS.indexOf(s.dias[0]) + 1} / span ${s.dias.length}` }}>
                <strong>Semana {i + 1}</strong>
                <span>{diaCurto(s.dias[0])} a {diaCurto(s.dias.at(-1)!)} · {plural(n, "conteúdo", "conteúdos")}</span>
              </div>
            );
          })}
          <span className="mapa-eixo" aria-hidden />
          {DIAS.map((d, i) => {
            const lista = dias.get(d) ?? [];
            const lado = lados.get(d);
            return (
              <Fragment key={d}>
                <div className="mapa-dia" data-tem={lista.length > 0} data-postado={lista.length > 0 && lista.every(foiPostado)} style={{ gridColumn: i + 1 }}>
                  <Marca d={d} />
                </div>
                {lado && (
                  <div className="mapa-no" data-lado={lado} style={{ gridColumn: i + 1, gridRow: lado === "cima" ? 2 : 4 }}>
                    <div className="mapa-no-cards">{lista.map((t) => <No key={t.id} t={t} abrir={abrir} />)}</div>
                    <span className="mapa-haste" aria-hidden />
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      <ol className="mapa-v">
        {grupos.map((s, i) => {
          const comNos = s.dias.filter((d) => dias.has(d));
          return (
            <li key={s.inicio}>
              <h2>Semana {i + 1} <small>{diaCurto(s.dias[0])} a {diaCurto(s.dias.at(-1)!)}</small></h2>
              {comNos.length ? (
                <ul>
                  {comNos.map((d) => (
                    <li key={d} className="mapa-v-dia" data-tem="true" data-postado={dias.get(d)!.every(foiPostado)}>
                      <Marca d={d} />
                      <div>{dias.get(d)!.map((t) => <No key={t.id} t={t} abrir={abrir} />)}</div>
                    </li>
                  ))}
                </ul>
              ) : <p className="mapa-v-vazio">Nada com data nesta semana.</p>}
            </li>
          );
        })}
      </ol>
    </>
  );
}

const Marca = ({ d }: { d: string }) => <span className="mapa-marca"><small>{nomeSemana(d)}</small><b>{Number(d.slice(8))}</b></span>;

function No({ t, abrir }: { t: Tarefa; abrir: (t: Tarefa) => void }) {
  const empresa = useEmpresas().find((e) => e.id === t.empresaId)?.nome ?? "Sem empresa";
  const postado = foiPostado(t);
  const dia = t.inicio!.slice(0, 10);
  return (
    <button type="button" className="mapa-card" data-postado={postado} style={{ "--cor-tarefa": `var(--${t.cor})` } as CSSProperties} onClick={() => abrir(t)}>
      <span className="mapa-card-topo">
        <span className="mapa-selo">{empresa}</span>
        {t.rede && <span className="mapa-rede">{NOMES.rede[t.rede]}</span>}
      </span>
      <span className="mapa-card-objetivo">{objetivoDe(t)}</span>
      <span className="mapa-card-pe">
        <span>{nomeSemana(dia)}, {diaCurto(dia)}</span>
        <span className="mapa-estado">
          {postado && <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4.5" /></svg>}
          {postado ? "Postado" : "A postar"}
        </span>
      </span>
    </button>
  );
}
