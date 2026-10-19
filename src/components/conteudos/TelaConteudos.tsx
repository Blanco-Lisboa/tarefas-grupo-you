"use client";

import { useState, type DragEvent } from "react";
import Image from "next/image";
import { Ficha } from "@/components/ficha/Ficha";
import { Selecao } from "@/components/ui/Selecao";
import { ETAPAS, salvarTarefa, useEmpresas, useTarefas, type Etapa, type Rede, type Tarefa } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import "./conteudos.css";

const nomes: Record<Etapa, string> = {
  ideia: "Ideia", roteiro: "Roteiro", gravacao: "Gravação",
  edicao: "Edição", aprovado: "Aprovado", postado: "Postado",
};
const redes: Record<Rede, { nome: string; icone: string }> = {
  instagram: { nome: "Instagram", icone: "/beec/icones/instagram-liso.svg" },
  tiktok: { nome: "TikTok", icone: "/beec/icones/marcas/tiktok-liso.svg" },
  youtube: { nome: "YouTube", icone: "/beec/icones/marcas/youtube-liso.svg" },
  kwai: { nome: "Kwai", icone: "/beec/icones/video-liso.svg" },
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
        <span className="conteudos-total">{conteudos.length} conteúdos</span>
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
                  <article
                    className="conteudos-cartao"
                    data-arrastando={arrastando === tarefa.id}
                    key={tarefa.id}
                    draggable
                    onDragStart={(evento) => iniciarArraste(evento, tarefa)}
                    onDragEnd={() => { setArrastando(null); setDestino(null); }}
                  >
                    <div className="conteudos-cartao-topo">
                      <span className="conteudos-empresa">{nomesEmpresas.get(tarefa.empresaId) ?? "Empresa removida"}</span>
                      {tarefa.rede && <span className="conteudos-rede" title={redes[tarefa.rede].nome}><Image src={redes[tarefa.rede].icone} alt={redes[tarefa.rede].nome} width={24} height={24} /></span>}
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
