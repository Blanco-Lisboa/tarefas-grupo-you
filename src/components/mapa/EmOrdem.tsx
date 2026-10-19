"use client";
import { useState } from "react";
import { useEmpresas, type Tarefa } from "@/lib/dados";
import { SeloEmpresa, IconeRede } from "@/components/ui/Marca";
import { Pessoa } from "@/components/ui/Pessoa";
import { diaCurto, nomeSemana } from "@/components/calendario/logica";
import { horaDe } from "@/components/tarefas/grade";
import { prazo, tituloDe, type DiaFila, type Item } from "./logica";
import "./em-ordem.css";

export type Formato = "linha" | "fila";
type Abrir = (t: Tarefa) => void;

/** Empresa (só a logo; o nome fica na dica e no leitor de tela) e rede: a mesma dupla de todo cartão do Mapa. */
function Marcas({ t }: { t: Tarefa }) {
  const empresa = useEmpresas().find((e) => e.id === t.empresaId)?.nome ?? "Sem empresa";
  return (
    <span className="eo-marcas">
      <SeloEmpresa empresaId={t.empresaId} nome={empresa} tamanho={18} />
      {t.rede && <IconeRede rede={t.rede} tamanho={16} />}
    </span>
  );
}

const quando = ({ t, dias }: Item) => (dias < 0 ? prazo(dias) : horaDe(t) || "Dia inteiro");

/** Fila: um card por dia. Hoje já vem aberto; os outros mostram só a data e a contagem e abrem ao clicar. */
export function EmOrdem({ grupos, abrir }: { grupos: DiaFila[]; abrir: Abrir }) {
  const [escolha, setEscolha] = useState<Readonly<Record<string, boolean>>>({}); // o que a pessoa abriu ou fechou; o resto segue o padrão (só hoje aberto)
  const estaAberto = (g: DiaFila) => escolha[g.dia] ?? g.dias === 0;
  if (!grupos.length) return <p className="mapa-vazio">Nada para fazer com os filtros de agora.</p>;
  return (
    <div className="eo-fila">
      {grupos.map((g) => {
        const { dia, dias, itens } = g;
        const aberto = estaAberto(g);
        return (
          <section key={dia} className="eo-dia" data-hoje={dias === 0} data-aberto={aberto}>
            <h2>
              <button type="button" className="eo-dia-topo" aria-expanded={aberto} aria-controls={`eo-${dia}`} onClick={() => setEscolha((e) => ({ ...e, [dia]: !aberto }))}>
                <span className="eo-dia-nome">{dias === 0 ? "Hoje" : nomeSemana(dia, "long")}</span>
                <span className="eo-dia-data">{dias === 0 ? `${nomeSemana(dia, "long")}, ${diaCurto(dia)}` : `${diaCurto(dia)} · ${prazo(dias)}`}</span>
                <span className="eo-dia-conta" aria-label={`${itens.length} ${itens.length === 1 ? "tarefa" : "tarefas"}`}>{itens.length}</span>
                <span className="eo-seta" aria-hidden />
              </button>
            </h2>
            {aberto && (
              <ul id={`eo-${dia}`}>
                {itens.map((i) => (
                  <li key={i.t.id}>
                    <button type="button" className="eo-linha" onClick={() => abrir(i.t)}>
                      <span className="eo-passo">{i.passo}</span>
                      <span className="eo-titulo">{tituloDe(i.t)}</span>
                      <Marcas t={i.t} />
                      <Pessoa quem={i.t.responsavel} tamanho={24} />
                      <span className="eo-prazo" data-urgente={i.dias < 0}>{quando(i)}</span>
                    </button>
                  </li>
                ))}
                {!itens.length && <li className="eo-nada">Nada para hoje.</li>}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
