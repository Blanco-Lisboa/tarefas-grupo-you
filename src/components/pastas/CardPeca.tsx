"use client";
/* eslint-disable @next/next/no-img-element -- o arquivo é um endereço temporário do navegador (blob:), next/image não serve */
import { useState } from "react";
import type { Empresa, Peca } from "@/lib/dados";
import { hashString } from "./arte";
import { ArtCanvas } from "./ArteCanvas";
import { receitaDaEmpresa } from "./cores";
import { CardFlutuante } from "./CardFlutuante";
import { SeloEmpresa } from "@/components/ui/Marca";
import { semLinks, TextoComLinks } from "./links";

export function CardPeca({ peca, empresa, pasta, aoEditar, aoExcluir, aoFechar }: { peca: Peca; empresa: Empresa; pasta: string; aoEditar: () => void; aoExcluir: () => void; aoFechar: () => void }) {
  const [confirmando, setConfirmando] = useState(false);
  const arq = peca.arquivo;
  return (
    <CardFlutuante titulo={semLinks(peca.titulo)} aoFechar={aoFechar}>
      <div className="peca-arte">
        {arq?.url ? (
          arq.tipo === "video" ? <video src={arq.url} controls /> : <img src={arq.url} alt={arq.nome} />
        ) : (
          <ArtCanvas art={receitaDaEmpresa(peca.tipo, empresa.id)} seed={hashString(peca.titulo) % 997} w={420} h={200} density={1} priority={0} />
        )}
      </div>
      <dl className="peca-info">
        <div><dt>Empresa</dt><dd><SeloEmpresa empresaId={empresa.id} nome={empresa.nome} tamanho={20} comNome /></dd></div>
        <div><dt>Pasta</dt><dd>{pasta}</dd></div>
        {peca.meta && <div><dt>Formato</dt><dd><TextoComLinks texto={peca.meta} /></dd></div>}
        <div><dt>Situação</dt><dd>Pronta para postar</dd></div>
        {peca.notas && <div className="peca-notas"><dt>Notas</dt><dd><TextoComLinks texto={peca.notas} /></dd></div>}
      </dl>
      {confirmando ? (
        <div className="ideia-acoes" role="alertdialog" aria-label="Confirmar exclusão da folha">
          <p className="pasta-texto">Excluir “{semLinks(peca.titulo)}”? Não dá para desfazer.</p>
          <button type="button" className="btn pasta-perigo" onClick={aoExcluir}>Excluir</button>
          <button type="button" className="btn btn-2" autoFocus onClick={() => setConfirmando(false)}>Manter</button>
        </div>
      ) : (
        <div className="ideia-acoes">
          {peca.link && <a className="btn" href={peca.link} target="_blank" rel="noopener noreferrer">Abrir no Drive</a>}
          <button type="button" className="btn btn-2" onClick={aoEditar}>Editar</button>
          <button type="button" className="btn btn-2 pasta-excluir" onClick={() => setConfirmando(true)}>Excluir</button>
        </div>
      )}
    </CardFlutuante>
  );
}
