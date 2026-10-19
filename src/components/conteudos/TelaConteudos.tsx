"use client";

import { useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent } from "react";
import { Ficha, tarefaEmBranco } from "@/components/ficha/Ficha";
import { IconeRede, SeloEmpresa } from "@/components/ui/Marca";
import { Pessoa } from "@/components/ui/Pessoa";
import { ETAPAS, salvarTarefa, useEmpresas, useTarefas, type Etapa, type NovaTarefa, type Tarefa } from "@/lib/dados";
import { tomDaEmpresa } from "@/lib/cores-empresa";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import "./conteudos.css";

const nomes: Record<Etapa, string> = {
  ideia: "Ideia", roteiro: "Roteiro", gravacao: "Gravação",
  edicao: "Edição", aprovado: "Aprovado", postado: "Postado",
};

type Arraste = { id: string; x: number; y: number; w: number; h: number };
const semAviso = () => () => {};
const hojeTexto = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const diaNumero = (texto: string) => { const [a, m, d] = texto.split("-").map(Number); return Date.UTC(a, m - 1, d) / 86_400_000; };

/** Quanto falta para a postagem. Conteúdo já postado ou sem data não tem contagem. */
function prazo(tarefa: Tarefa, hoje: string): { texto: string; tom: "atrasado" | "perto" | "normal" } | null {
  if (!tarefa.inicio || !hoje || tarefa.etapa === "postado") return null;
  const dias = diaNumero(tarefa.inicio.slice(0, 10)) - diaNumero(hoje);
  if (dias < 0) return { texto: "atrasado", tom: "atrasado" };
  if (dias === 0) return { texto: "hoje", tom: "perto" };
  return { texto: dias === 1 ? "posta amanhã" : `posta em ${dias} dias`, tom: dias <= 2 ? "perto" : "normal" };
}
const linkDrive = (tarefa: Tarefa) => tarefa.links.find((l) => /^(https?:\/\/)?drive\.google\.com\//.test(l.url.trim()));

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
  const [aberta, setAberta] = useState<NovaTarefa | null>(null);
  const [arraste, setArraste] = useState<Arraste | null>(null);
  const [destino, setDestino] = useState<Etapa | null>(null);
  const pegada = useRef<{ id: string; px: number; py: number; caixa: DOMRect; ativo: boolean } | null>(null);
  const quadro = useRef<HTMLDivElement>(null);
  const hoje = useSyncExternalStore(semAviso, hojeTexto, () => ""); // servidor: "" até hidratar (fuso)
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

  // Arraste por ponteiro (mouse e dedo): o card só "pega" depois de andar 6px, para o clique no título continuar abrindo a ficha.
  function colunaEm(x: number, y: number) {
    for (const el of document.querySelectorAll<HTMLElement>("[data-etapa]")) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return el.dataset.etapa as Etapa;
    }
    return null;
  }

  function pegar(evento: PointerEvent<HTMLElement>, tarefa: Tarefa) {
    if (evento.button !== 0 || (evento.target as HTMLElement).closest("a")) return;
    pegada.current = { id: tarefa.id, px: evento.clientX, py: evento.clientY, caixa: evento.currentTarget.getBoundingClientRect(), ativo: false };
  }

  function mover(evento: PointerEvent<HTMLElement>) {
    const p = pegada.current;
    if (!p) return;
    if (!p.ativo) {
      if (Math.hypot(evento.clientX - p.px, evento.clientY - p.py) < 6) return;
      p.ativo = true;
      evento.currentTarget.setPointerCapture(evento.pointerId);
    }
    setArraste({ id: p.id, x: p.caixa.left + evento.clientX - p.px, y: p.caixa.top + evento.clientY - p.py, w: p.caixa.width, h: p.caixa.height });
    setDestino(colunaEm(evento.clientX, evento.clientY));
    const q = quadro.current?.getBoundingClientRect(); // perto da borda, o quadro rola sozinho
    if (q && quadro.current) quadro.current.scrollLeft += evento.clientX > q.right - 48 ? 14 : evento.clientX < q.left + 48 ? -14 : 0;
  }

  function soltar(evento: PointerEvent<HTMLElement>, cancelado = false) {
    const p = pegada.current;
    pegada.current = null;
    if (!p?.ativo) return;
    const etapa = cancelado ? null : colunaEm(evento.clientX, evento.clientY);
    const tarefa = tarefas.find((item) => item.id === p.id);
    if (tarefa && etapa) void mudarEtapa(tarefa, etapa);
    setArraste(null);
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
      <div className="conteudos-quadro" ref={quadro} aria-label="Quadro de conteúdos por etapa">
        {ETAPAS.map((etapa, indice) => {
          const itens = conteudos.filter((t) => t.etapa === etapa);
          return (
            <section
              className="conteudos-coluna"
              data-destino={destino === etapa}
              data-etapa={etapa}
              key={etapa}
              style={{ "--etapa": `var(--etapa-${etapa})` } as CSSProperties}
            >
              <div className="conteudos-coluna-topo">
                <span className="conteudos-numero">{String(indice + 1).padStart(2, "0")}</span>
                <h2>{nomes[etapa]}</h2>
                <span className="conteudos-contagem">{itens.length}</span>
                <button className="conteudos-novo" type="button" aria-label={`Novo conteúdo em ${nomes[etapa]}`} onClick={() => setAberta(tarefaEmBranco({ etapa }))}>+</button>
              </div>
              <div className="conteudos-pilha">
                {itens.length === 0 && <p className="conteudos-vazio">Solte um conteúdo aqui.</p>}
                {itens.map((tarefa) => {
                  const levantado = arraste?.id === tarefa.id ? arraste : null;
                  const falta = prazo(tarefa, hoje);
                  const drive = linkDrive(tarefa);
                  return (
                  <div className="conteudos-cartao-sombra" data-vazio={!!levantado} style={levantado ? { height: levantado.h } : undefined} key={tarefa.id}>
                  <article
                    className="conteudos-cartao"
                    data-arrastando={!!levantado}
                    style={levantado ? { left: levantado.x, top: levantado.y, width: levantado.w } : undefined}
                    onPointerDown={(evento) => pegar(evento, tarefa)}
                    onPointerMove={mover}
                    onPointerUp={(evento) => soltar(evento)}
                    onPointerCancel={(evento) => soltar(evento, true)}
                  >
                    <div className="conteudos-cartao-topo">
                      <span className="conteudos-empresa" style={{ "--marca": tomDaEmpresa(tarefa.empresaId).r } as CSSProperties}><SeloEmpresa empresaId={tarefa.empresaId} nome={nomesEmpresas.get(tarefa.empresaId) ?? "Empresa removida"} tamanho={20} /></span>
                      {tarefa.rede && <span className="conteudos-rede"><IconeRede rede={tarefa.rede} tamanho={18} /></span>}
                    </div>
                    <button className="conteudos-titulo" type="button" onClick={() => setAberta(tarefa)}>{tarefa.titulo}</button>
                    <div className="conteudos-cartao-rodape">
                      <Pessoa quem={tarefa.responsavel} tamanho={25} />
                      <time dateTime={tarefa.inicio?.slice(0, 10)}>{dataLegivel(tarefa.inicio)}</time>
                    </div>
                    {(falta || drive) && (
                      <div className="conteudos-prazo">
                        {falta && <span className="conteudos-contagem-dias" data-tom={falta.tom}>{falta.texto}</span>}
                        {drive && <a className="conteudos-drive" href={drive.url} target="_blank" rel="noopener noreferrer" title="Abrir no Drive">Drive</a>}
                      </div>
                    )}
                  </article>
                  </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      {aberta && <Ficha tarefa={aberta} aoFechar={() => setAberta(null)} />}
    </section>
  );
}
