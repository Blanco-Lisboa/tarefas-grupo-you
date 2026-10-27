"use client";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useEmpresas, type Ocorrencia } from "@/lib/dados";
import { NOMES } from "@/components/ficha/Ficha";
import { tomDaEmpresa } from "@/lib/cores-empresa";
import { SeloEmpresa } from "@/components/ui/Marca";
import { Pessoa } from "@/components/ui/Pessoa";
import { ESTADOS, quando } from "./logica";

// Um bloco do calendário de postagens: cor da empresa (filete e tom), logo, formato e hora. O estado vem do banco; a cor do FUNDO diz se saiu
// (verde), faltou (vermelho) ou saiu sem plano (cinza tracejado), e o texto repete o estado (a cor nunca fala sozinha).
export const Marca = ({ estado }: { estado: Ocorrencia["estado"] }) => (
  <svg className="pbloco-sinal" viewBox="0 0 16 16" aria-hidden>
    {estado === "feita" ? <path d="M3 8.5l3.2 3L13 4.5" /> : estado === "faltou" ? <path d="M4 4l8 8M12 4l-8 8" /> : estado === "extra" ? <path d="M8 3v10M3 8h10" /> : <circle cx="8" cy="8" r="4.5" />}
  </svg>
);

/** `modo`: "cartao" na semana (título e linha de baixo), "chip" no mês (uma linha). `aoAbrir` só existe para o Natham, em bloco que tem planejada. */
export function Bloco({ o, modo, aoAbrir, aoVerCard }: { o: Ocorrencia; modo: "cartao" | "chip"; aoAbrir?: (o: Ocorrencia) => void; aoVerCard?: (id: string) => void }) {
  const dona = useEmpresas().find((e) => e.id === o.empresaId);
  const empresa = dona?.nome ?? o.empresaId;
  const formato = o.formato ? NOMES.formato[o.formato] : "Post";
  const titulo = o.titulo || o.cardTitulo || "";
  const hora = quando(o) || "meta"; // sem hora = meta do dia
  const rotulo = `${formato} ${empresa} · ${quando(o) || "meta do dia"} · ${ESTADOS[o.estado]}`;
  const estilo = { "--cor": tomDaEmpresa(o.empresaId).r } as CSSProperties;
  // Abre a ficha do card aqui mesmo (aoVerCard); sem ela (card ainda não carregado), cai no link da Esteira
  const icone = <svg viewBox="0 0 16 16" aria-hidden><rect x="2.5" y="3" width="11" height="10" rx="2" /><path d="M5 6.5h6M5 9.5h4" /></svg>;
  const card = o.cardId && (aoVerCard
    ? <button type="button" className="pbloco-card" title="Ver card" onClick={(e) => { e.stopPropagation(); aoVerCard(o.cardId!); }}>{icone}<span>Ver card</span></button>
    : <Link className="pbloco-card" title="Ver card" href={`/conteudos?ficha=${o.cardId}`} onClick={(e) => e.stopPropagation()}>{icone}<span>Ver card</span></Link>);
  const miolo = modo === "chip" ? (
    <span className="pbloco-linha">
      <SeloEmpresa empresaId={o.empresaId} nome={empresa} tamanho={14} />
      <span className="pbloco-formato">{formato}</span>
      <span className="pbloco-hora">{hora}</span>
      <Marca estado={o.estado} />
    </span>
  ) : (
    <>
      <span className="pbloco-linha">
        <SeloEmpresa empresaId={o.empresaId} nome={empresa} tamanho={18} />
        <span className="pbloco-formato">{formato}</span>
        <span className="pbloco-hora">{hora}</span>
      </span>
      {titulo && <span className="pbloco-titulo">{titulo}</span>}
      <span className="pbloco-pe">
        <span className="pbloco-estado"><Marca estado={o.estado} />{ESTADOS[o.estado]}</span>
        {o.responsavel && o.estado !== "extra" && <Pessoa quem={o.responsavel} tamanho={16} />}
      </span>
    </>
  );
  const props = { className: `pbloco pbloco-${modo}`, "data-estado": o.estado, style: estilo, title: `${rotulo}${titulo ? `\n${titulo}` : ""}` };
  return (
    <div {...props}>
      {aoAbrir
        ? <button type="button" className="pbloco-corpo" aria-label={`Editar: ${rotulo}`} onClick={() => aoAbrir(o)}>{miolo}</button>
        : <div className="pbloco-corpo">{miolo}</div>}
      {modo === "cartao" && card}
    </div>
  );
}
