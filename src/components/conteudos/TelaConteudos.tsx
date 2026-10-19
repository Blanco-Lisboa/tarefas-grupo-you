"use client";

import { useState, type CSSProperties, type DragEvent } from "react";
import { Ficha } from "@/components/ficha/Ficha";
import { Selecao } from "@/components/ui/Selecao";
import { ETAPAS, salvarTarefa, useEmpresas, useTarefas, type Etapa, type Rede, type Tarefa } from "@/lib/dados";
import { tomDaEmpresa } from "@/lib/cores-empresa";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import "./conteudos.css";

const nomes: Record<Etapa, string> = {
  ideia: "Ideia", roteiro: "Roteiro", gravacao: "Gravação",
  edicao: "Edição", aprovado: "Aprovado", postado: "Postado",
};
const redes: Record<Rede, { nome: string; sigla: string }> = {
  instagram: { nome: "Instagram", sigla: "IG" },
  tiktok: { nome: "TikTok", sigla: "TT" },
  youtube: { nome: "YouTube", sigla: "YT" },
  kwai: { nome: "Kwai", sigla: "KW" },
};
const opcoesEtapa = ETAPAS.map((etapa) => ({ valor: etapa, rotulo: nomes[etapa] }));

function dataLegivel(inicio?: string) {
  if (!inicio) return "Sem data";
  const [data, hora] = inicio.split("T");
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}${hora ? ` às ${hora.slice(0, 5)}` : ""}`;
}

export function TelaConteudos() {
  const tarefas = useTarefas();
  const empresas = useEmpresas();
  const { aplicar } = useFiltroEmpresa();
  const [aberta, setAberta] = useState<Tarefa | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [destino, setDestino] = useState<Etapa | null>(null);
  const [erro, setErro] = useState("");
  const conteudos = aplicar(tarefas).filter((t): t is Tarefa & { etapa: Etapa } => !!t.etapa && ETAPAS.includes(t.etapa));
  const nomesEmpresas = new Map(empresas.map((e) => [e.id, e.nome]));

  async function mudarEtapa(tarefa: Tarefa, etapa: Etapa) {
    if (tarefa.etapa === etapa) return;
    try {
      setErro("");
      await salvarTarefa({ ...tarefa, etapa });
      if (aberta?.id === tarefa.id) setAberta({ ...tarefa, etapa });
    } catch {
      setErro("Não foi possível salvar a etapa. Tente novamente.");
    }
  }

  function iniciarArraste(evento: DragEvent<HTMLElement>, tarefa: Tarefa) {
    evento.dataTransfer.setData("text/plain", tarefa.id);
    evento.dataTransfer.effectAllowed = "move";
    setArrastando(tarefa.id);
  }

  function soltar(evento: DragEvent<HTMLElement>, etapa: Etapa) {
    evento.preventDefault();
    const id = evento.dataTransfer.getData("text/plain");
    const tarefa = tarefas.find((item) => item.id === id);
    if (tarefa && conteudos.some((item) => item.id === id)) void mudarEtapa(tarefa, etapa);
    setArrastando(null);
    setDestino(null);
  }

  return (
    <section className="conteudos-tela">
      <header className="conteudos-cabecalho">
        <div>
          <h1>Conteúdos</h1>
          <p>Acompanhe cada conteúdo da ideia à publicação.</p>
        </div>
        <div className="conteudos-total bloco-destaque"><strong className="bloco-numero">{conteudos.length}</strong><span className="bloco-fraco">conteúdos</span></div>
      </header>
      {erro && <p className="conteudos-erro" role="alert">{erro}</p>}
      <div className="conteudos-quadro" aria-label="Quadro de conteúdos por etapa">
        {ETAPAS.map((etapa, indice) => {
          const itens = conteudos.filter((t) => t.etapa === etapa);
          return (
            <section
              className="conteudos-coluna"
              data-destino={destino === etapa}
              key={etapa}
              style={{ "--etapa": `var(--etapa-${etapa})` } as CSSProperties}
              onDragOver={(evento) => { evento.preventDefault(); evento.dataTransfer.dropEffect = "move"; setDestino(etapa); }}
              onDragLeave={(evento) => { if (!evento.currentTarget.contains(evento.relatedTarget as Node)) setDestino(null); }}
              onDrop={(evento) => soltar(evento, etapa)}
            >
              <div className="conteudos-coluna-topo">
                <span className="conteudos-numero">{String(indice + 1).padStart(2, "0")}</span>
                <h2>{nomes[etapa]}</h2>
                <span className="conteudos-contagem">{itens.length}</span>
              </div>
              <div className="conteudos-pilha">
                {itens.length === 0 && <p className="conteudos-vazio">Solte um conteúdo aqui.</p>}
                {itens.map((tarefa) => (
                  <div className="conteudos-cartao-sombra" key={tarefa.id}>
                  <article
                    className="conteudos-cartao"
                    data-arrastando={arrastando === tarefa.id}
                    draggable
                    onDragStart={(evento) => iniciarArraste(evento, tarefa)}
                    onDragEnd={() => { setArrastando(null); setDestino(null); }}
                  >
                    <div className="conteudos-cartao-topo">
                      <span className="conteudos-empresa" style={{ "--marca": tomDaEmpresa(tarefa.empresaId).r } as CSSProperties}><span>{nomesEmpresas.get(tarefa.empresaId) ?? "Empresa removida"}</span></span>
                      {tarefa.rede && <span className="conteudos-rede" title={redes[tarefa.rede].nome} aria-label={redes[tarefa.rede].nome}>{redes[tarefa.rede].sigla}</span>}
                    </div>
                    <button className="conteudos-titulo" type="button" onClick={() => setAberta(tarefa)}>{tarefa.titulo}</button>
                    <div className="conteudos-cartao-rodape">
                      <span className="conteudos-responsavel" title={tarefa.responsavel === "natham" ? "Natham" : "Matheus"}>{tarefa.responsavel === "natham" ? "N" : "M"}</span>
                      <time dateTime={tarefa.inicio?.slice(0, 10)}>{dataLegivel(tarefa.inicio)}</time>
                    </div>
                    <div className="conteudos-mover" onPointerDown={(evento) => evento.stopPropagation()}>
                      <Selecao
                        rotulo="Etapa"
                        opcoes={opcoesEtapa}
                        valor={[tarefa.etapa]}
                        multipla={false}
                        aoMudar={([etapa]) => { if (etapa) void mudarEtapa(tarefa, etapa as Etapa); }}
                      />
                    </div>
                  </article>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {aberta && <Ficha tarefa={aberta} aoFechar={() => setAberta(null)} />}
    </section>
  );
}
