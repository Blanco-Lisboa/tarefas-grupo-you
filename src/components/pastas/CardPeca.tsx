"use client";
import type { Empresa, Peca, TipoPeca } from "@/lib/dados";
import { hashString } from "./arte";
import { ArtCanvas } from "./ArteCanvas";
import { receitaDaEmpresa } from "./cores";
import { CardFlutuante } from "./CardFlutuante";
import { SeloEmpresa } from "@/components/ui/Marca";
import { semLinks, TextoComLinks } from "./links";

const NOME: Record<TipoPeca, string> = { post: "Post", carrossel: "Carrossel", video: "Vídeo", story: "Story" };

export function CardPeca({ peca, empresa, aoFechar }: { peca: Peca; empresa: Empresa; aoFechar: () => void }) {
  return (
    <CardFlutuante titulo={semLinks(peca.titulo)} aoFechar={aoFechar}>
      <div className="peca-arte">
        <ArtCanvas art={receitaDaEmpresa(peca.tipo, empresa.id)} seed={hashString(peca.titulo) % 997} w={420} h={200} density={1} priority={0} />
      </div>
      <dl className="peca-info">
        <div><dt>Empresa</dt><dd><SeloEmpresa empresaId={empresa.id} nome={empresa.nome} tamanho={20} comNome /></dd></div>
        <div><dt>Tipo</dt><dd>{NOME[peca.tipo]}</dd></div>
        {peca.meta && <div><dt>Formato</dt><dd><TextoComLinks texto={peca.meta} /></dd></div>}
        <div><dt>Situação</dt><dd>Pronta para postar</dd></div>
      </dl>
      {peca.link && (
        <a className="btn" href={peca.link} target="_blank" rel="noopener noreferrer">Abrir no Drive</a>
      )}
    </CardFlutuante>
  );
}
