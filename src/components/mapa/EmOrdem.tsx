"use client";
import { useEmpresas, type Tarefa } from "@/lib/dados";
import { SeloEmpresa, IconeRede } from "@/components/ui/Marca";
import { Pessoa } from "@/components/ui/Pessoa";
import { NOMES } from "@/components/ficha/Ficha";
import { ETAPAS_ATE_POSTAR, faixaDe, prazo, tituloDe, type Faixa, type Item } from "./logica";
import "./em-ordem.css";

export type Formato = "linha" | "fila" | "foco" | "quadro";
type Abrir = (t: Tarefa) => void;

const FAIXAS: [Faixa, string][] = [["agora", "Agora"], ["proximo", "Próximos 7 dias"], ["depois", "Depois"]];
const porFaixa = (itens: Item[], f: Faixa) => itens.filter((i) => faixaDe(i.dias) === f);

/** Empresa (logo + nome) e rede: a mesma dupla de todo cartão do Mapa. */
function Marcas({ t, nome = true }: { t: Tarefa; nome?: boolean }) {
  const empresa = useEmpresas().find((e) => e.id === t.empresaId)?.nome ?? "Sem empresa";
  return (
    <span className="eo-marcas">
      <SeloEmpresa empresaId={t.empresaId} nome={empresa} tamanho={16} comNome={nome} />
      {t.rede && <IconeRede rede={t.rede} tamanho={16} />}
    </span>
  );
}

const Prazo = ({ dias }: { dias: number }) => <span className="eo-prazo" data-urgente={dias <= 0}>{prazo(dias)}</span>;

/** Trilha das etapas até postar: as feitas cheias, a atual com anel, as que faltam vazias. */
function Trilha({ etapa }: { etapa: number }) {
  return (
    <ol className="eo-trilha" aria-label={`Etapa atual: ${NOMES.etapa[ETAPAS_ATE_POSTAR[etapa]]}`}>
      {ETAPAS_ATE_POSTAR.map((e, i) => (
        <li key={e} data-estado={i < etapa ? "feita" : i === etapa ? "atual" : "falta"}><span aria-hidden />{NOMES.etapa[e]}</li>
      ))}
      <li data-estado="falta"><span aria-hidden />Postado</li>
    </ol>
  );
}

// ---------- Fila: lista numerada, em três faixas ----------
function Fila({ itens, abrir }: { itens: Item[]; abrir: Abrir }) {
  let n = 0;
  return (
    <div className="eo-fila">
      {FAIXAS.map(([f, rotulo]) => {
        const g = porFaixa(itens, f);
        return g.length ? (
          <section key={f} className="eo-faixa" data-faixa={f}>
            <h2>{rotulo}<span>{g.length}</span></h2>
            <ul>
              {g.map((i) => (
                <li key={i.t.id}>
                  <button type="button" className="eo-linha" onClick={() => abrir(i.t)}>
                    <span className="eo-num">{++n}</span>
                    <span className="eo-passo">{i.passo}</span>
                    <span className="eo-titulo">{tituloDe(i.t)}</span>
                    <Marcas t={i.t} />
                    <Pessoa quem={i.t.responsavel} tamanho={24} />
                    <Prazo dias={i.dias} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null;
      })}
    </div>
  );
}

// ---------- Foco: um cartão grande com o que fazer agora + quem vem em seguida ----------
function Foco({ itens, abrir }: { itens: Item[]; abrir: Abrir }) {
  const [primeiro, ...resto] = itens;
  const seguem = resto.slice(0, 3);
  const depois = resto.slice(3);
  return (
    <div className="eo-foco">
      <button type="button" className="eo-grande" onClick={() => abrir(primeiro.t)}>
        <span className="eo-rotulo">Faça agora</span>
        <span className="eo-grande-passo">{primeiro.passo}</span>
        <span className="eo-grande-titulo">{tituloDe(primeiro.t)}</span>
        <Trilha etapa={primeiro.etapa} />
        <span className="eo-grande-rodape">
          <Marcas t={primeiro.t} />
          <span className="eo-quem"><Pessoa quem={primeiro.t.responsavel} tamanho={28} />{NOMES.responsavel[primeiro.t.responsavel]}</span>
          <Prazo dias={primeiro.dias} />
        </span>
      </button>
      {seguem.length > 0 && (
        <section>
          <h2 className="eo-sub">Em seguida</h2>
          <ul className="eo-seguem">
            {seguem.map((i, k) => (
              <li key={i.t.id}>
                <button type="button" className="eo-media" onClick={() => abrir(i.t)}>
                  <span className="eo-rotulo">{k + 2}º · {i.passo}</span>
                  <span className="eo-titulo">{tituloDe(i.t)}</span>
                  <span className="eo-media-rodape"><Marcas t={i.t} nome={false} /><Pessoa quem={i.t.responsavel} tamanho={22} /><Prazo dias={i.dias} /></span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {depois.length > 0 && (
        <section>
          <h2 className="eo-sub">Na fila <span>{depois.length}</span></h2>
          <ul className="eo-depois">
            {depois.map((i) => (
              <li key={i.t.id}>
                <button type="button" onClick={() => abrir(i.t)}>
                  <span className="eo-passo-leve">{i.passo}</span>
                  <span className="eo-titulo">{tituloDe(i.t)}</span>
                  <Marcas t={i.t} nome={false} />
                  <Pessoa quem={i.t.responsavel} tamanho={20} />
                  <Prazo dias={i.dias} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ---------- Quadro: três colunas, Agora | Próximos 7 dias | Depois ----------
function Quadro({ itens, abrir }: { itens: Item[]; abrir: Abrir }) {
  return (
    <div className="eo-quadro">
      {FAIXAS.map(([f, rotulo]) => {
        const g = porFaixa(itens, f);
        return (
          <section key={f} className="eo-coluna" data-faixa={f}>
            <h2>{rotulo}<span>{g.length}</span></h2>
            <ul>
              {g.map((i) => (
                <li key={i.t.id}>
                  <button type="button" className="eo-ficha" onClick={() => abrir(i.t)}>
                    <span className="eo-passo">{i.passo}</span>
                    <span className="eo-titulo">{tituloDe(i.t)}</span>
                    <span className="eo-ficha-rodape"><Marcas t={i.t} /><Pessoa quem={i.t.responsavel} tamanho={22} /></span>
                    <Prazo dias={i.dias} />
                  </button>
                </li>
              ))}
              {!g.length && <li className="eo-nada">Nada aqui.</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function EmOrdem({ formato, itens, abrir }: { formato: Exclude<Formato, "linha">; itens: Item[]; abrir: Abrir }) {
  if (!itens.length) return <p className="mapa-vazio">Nada para fazer com os filtros de agora.</p>;
  const Tela = { fila: Fila, foco: Foco, quadro: Quadro }[formato];
  return <Tela itens={itens} abrir={abrir} />;
}
