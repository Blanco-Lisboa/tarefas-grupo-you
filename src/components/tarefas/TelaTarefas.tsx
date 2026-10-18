"use client";
import { useState, useSyncExternalStore } from "react";
import { removerTarefa, salvarTarefa, useEmpresas, useTarefas, type Tarefa } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { Folha, type LinhaFolha } from "./Folha";
import { LETRA_PRINCIPAL } from "./fontes";
import { useFeitas } from "./feitas";
import "./caderno.css";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const paraData = (dia: string) => new Date(+dia.slice(0, 4), +dia.slice(5, 7) - 1, +dia.slice(8, 10));
const somarDias = (dia: string, n: number) => { const d = paraData(dia); d.setDate(d.getDate() + n); return iso(d); };
// "" no servidor: o dia de hoje só existe no navegador de quem abre (evita diferença de fuso na hidratação).
const hojeLocal = () => iso(new Date());
const semAssinatura = () => () => {};

const NOMES = { natham: "Natham", matheus: "Matheus" } as const;
const hora = (t: Tarefa) => {
  if (t.diaInteiro || !t.inicio || t.inicio.length < 16) return "";
  const [h, m] = [t.inicio.slice(11, 13), t.inicio.slice(14, 16)];
  return `${+h}h${m === "00" ? "" : m}`;
};

export function TelaTarefas() {
  const hoje = useSyncExternalStore(semAssinatura, hojeLocal, () => "");
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [aba, setAba] = useState<"dia" | "semdata">("dia");
  const dia = escolhido ?? hoje;

  const tarefas = useTarefas();
  const empresas = useEmpresas();
  const { aplicar, selecionadas } = useFiltroEmpresa();
  const { feitas, alternar } = useFeitas();

  if (!dia) return <section className="tarefas-tela" aria-busy="true" />;

  const nomeEmpresa = (id: string) => empresas.find((e) => e.id === id)?.nome ?? id;
  const porHora = (a: Tarefa, b: Tarefa) => (a.inicio ?? "").localeCompare(b.inicio ?? "") || a.titulo.localeCompare(b.titulo);
  const doDia = aplicar(tarefas).filter((t) => t.inicio?.slice(0, 10) === dia).sort(porHora);
  const semData = aplicar(tarefas).filter((t) => !t.inicio);
  const mostradas = aba === "dia" ? doDia : semData;

  const linhas: LinhaFolha[] = mostradas.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    detalhe: [nomeEmpresa(t.empresaId), NOMES[t.responsavel], hora(t)].filter(Boolean).join(" · "),
    feita: feitas.includes(t.id),
  }));

  const feitasAqui = linhas.filter((l) => l.feita).length;
  const resumo = linhas.length ? `${linhas.length} ${linhas.length === 1 ? "tarefa" : "tarefas"}, ${feitasAqui} ${feitasAqui === 1 ? "feita" : "feitas"}` : undefined;
  const titulo = aba === "dia"
    ? paraData(dia).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, (c) => c.toUpperCase())
    : "Sem data";

  const empresasEscolha = empresas.filter((e) => !selecionadas.length || selecionadas.includes(e.id));
  const ir = (d: string) => { setEscolhido(d || null); setAba("dia"); };

  return (
    <section className="tarefas-tela">
      <div className="tarefas-barra">
        <h1 className="tarefas-titulo">Tarefas</h1>
        <button type="button" className="tarefas-botao" aria-pressed={aba === "dia"} onClick={() => setAba("dia")}>Dia</button>
        <button type="button" className="tarefas-botao" aria-pressed={aba === "semdata"} onClick={() => setAba("semdata")}>Sem data</button>
      </div>
      <div className="tarefas-barra">
        <button type="button" className="tarefas-botao" onClick={() => ir(somarDias(dia, -1))} aria-label="Dia anterior">Anterior</button>
        <button type="button" className="tarefas-botao" onClick={() => ir(hoje)}>Hoje</button>
        <button type="button" className="tarefas-botao" onClick={() => ir(somarDias(dia, 1))} aria-label="Próximo dia">Próximo</button>
        <input type="date" className="tarefas-data" value={dia} onChange={(e) => e.target.value && ir(e.target.value)} aria-label="Ir para o dia" />
      </div>

      <div key={aba === "dia" ? dia : "semdata"} className="folha-pagina">
        <Folha
          letra={LETRA_PRINCIPAL}
          titulo={titulo}
          subtitulo={resumo}
          linhas={linhas}
          vazio={aba === "dia" ? "Nada marcado para este dia." : "Nenhuma tarefa sem data."}
          empresas={empresasEscolha}
          empresaPadrao={empresasEscolha[0]?.id ?? ""}
          aoMarcar={alternar}
          aoApagar={(id) => void removerTarefa(id)}
          aoEscrever={(t, empresaId, responsavel) =>
            void salvarTarefa({
              titulo: t, tipo: "outro", empresaId, responsavel, cor: "etiqueta-5", links: [], arquivos: [],
              ...(aba === "dia" ? { inicio: dia, diaInteiro: true } : { diaInteiro: false }),
            })
          }
        />
      </div>
    </section>
  );
}
