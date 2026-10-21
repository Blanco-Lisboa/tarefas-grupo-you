"use client";
import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useEmpresas, type Tarefa } from "@/lib/dados";
import { SeloEmpresa, IconeRede } from "@/components/ui/Marca";
import { NOMES } from "@/components/ficha/Ficha";
import { PastaDeVidro } from "@/components/pastas/PastaDeVidro";
import { receitaDaEmpresa, tomDaEmpresa } from "@/components/pastas/cores";
import { horaDe } from "@/components/tarefas/grade";
import { foiPostado, tituloDe } from "./logica";

const REDE_NOME = { instagram: "Instagram", facebook: "Facebook" } as const;
const estadoDe = (t: Tarefa) => (foiPostado(t) ? "Postado" : t.etapa ? NOMES.etapa[t.etapa] : "A postar");

/** Card Postado (204): formato, redes, data e os links do post, sem arquivo. */
function PostadoNasRedes({ t }: { t: Tarefa }) {
  const postadas = (t.postagens ?? []).filter((p) => p.status === "postado");
  if (!postadas.length) return null;
  const quando = postadas.map((p) => p.postadoEm).filter(Boolean).sort()[0];
  const data = quando ? new Date(quando).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }) : "";
  return (
    <div className="mapa-postado">
      <strong>{tituloDe(t)}</strong>
      <span>{[t.formato && NOMES.formato[t.formato], postadas.map((p) => REDE_NOME[p.rede]).join(" + "), data].filter(Boolean).join(" · ")}</span>
      {postadas.filter((p) => p.link).map((p) => <a key={p.rede} href={p.link} target="_blank" rel="noopener noreferrer">Ver no {REDE_NOME[p.rede]}</a>)}
    </div>
  );
}

/**
 * Item 213: os conteúdos de UMA empresa em UM dia viram uma pasta de vidro na cor da empresa (a mesma das Pastas).
 * Pequena na linha do tempo; ao clicar ela abre grande no centro da tela, com as folhas brancas saindo de dentro,
 * porque no tamanho da linha do tempo as letras das folhas não dariam para ler.
 */
export function PastaDoDia({ empresaId, ts, abrir }: { empresaId: string; ts: Tarefa[]; abrir: (t: Tarefa) => void }) {
  const nome = useEmpresas().find((e) => e.id === empresaId)?.nome ?? "Sem empresa";
  const [grande, setGrande] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const t = tomDaEmpresa(empresaId);
  const arte = receitaDaEmpresa("post", empresaId);
  const legenda = `${ts.length} ${ts.length === 1 ? "conteúdo" : "conteúdos"}`;
  const arquivos = ts.map((c) => ({
    id: c.id,
    nome: tituloDe(c),
    meta: [horaDe(c), estadoDe(c)].filter(Boolean).join(" · "),
    arte,
    detalhe: (
      <span className="gf-sheet-detalhe">
        {c.rede && <IconeRede rede={c.rede} tamanho={14} />}
        <span>{estadoDe(c)}</span>
        {horaDe(c) && <span>· {horaDe(c)}</span>}
      </span>
    ),
  }));
  const comum = {
    rotulo: nome,
    legenda,
    arte,
    arquivos,
    folhasBrancas: true,
    tom: { base: t.r, sombra: `${t.g}99` },
    selo: <SeloEmpresa empresaId={empresaId} nome={nome} tamanho={36} />,
  };
  const fechar = () => {
    setGrande(false);
    raiz.current?.querySelector<HTMLElement>(".gf-hit")?.focus();
  };
  const postados = ts.filter(foiPostado);
  let aberto: ReactNode = null;
  if (grande) {
    aberto = createPortal(
      <div className="mapa-pasta-fundo" onClick={(e) => { if (e.target === e.currentTarget) fechar(); }}
        // "Ver todas" e a lista ficam fora da pasta: sem isto, tocar neles fecharia tudo
        onPointerDown={(e) => { if ((e.target as Element).closest(".gf-barra, .gf-lista, .mapa-postados")) e.stopPropagation(); }}>
        <div className="mapa-pasta-grande">
          <PastaDeVidro {...comum} defaultOpen seed={11} aoMudar={(a) => { if (!a) fechar(); }} onSelecionar={(a) => { const c = ts.find((x) => x.id === a.id); setGrande(false); if (c) abrir(c); }} />
          {postados.length > 0 && <div className="mapa-postados">{postados.map((c) => <PostadoNasRedes key={c.id} t={c} />)}</div>}
        </div>
      </div>,
      document.body,
    );
  }
  return (
    <div ref={raiz} className="mapa-pasta">
      <PastaDeVidro {...comum} miniatura seed={3} aoClicar={() => setGrande(true)} />
      {aberto}
    </div>
  );
}
