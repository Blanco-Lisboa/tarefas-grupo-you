import type { CSSProperties } from "react";
import { RESPONSAVEIS, type Responsavel, type Tag as TagDado } from "@/lib/dados";
import { Pessoa } from "./Pessoa";
import "./tag.css";

/** Foto de quem aprova: Natham e Matheus têm foto (Pessoa); os outros nomes caem na inicial. */
export function Aprovador({ nome, tamanho = 16 }: { nome: string; tamanho?: number }) {
  const chave = nome.toLowerCase() as Responsavel;
  if (RESPONSAVEIS.includes(chave)) return <Pessoa quem={chave} tamanho={tamanho} />;
  return <span className="pessoa" role="img" aria-label={nome} title={nome} style={{ width: tamanho, height: tamanho, fontSize: Math.round(tamanho * 0.5) }}>{nome[0]?.toUpperCase()}</span>;
}

/** Etiqueta colorida da tag. Com aprovador (só tag de aprovação), mostra "Nome · Aprovador", com a foto se a pessoa tiver. */
export function TagChip({ tag, aprovador }: { tag: TagDado; aprovador?: string }) {
  const quem = tag.aprovacao ? aprovador : undefined;
  return (
    <span className="tag-chip" style={{ "--tag": `var(--${tag.cor})`, "--tag-texto": `var(--${tag.cor}-texto)` } as CSSProperties}>
      {tag.nome}
      {quem && <>{" · "}{RESPONSAVEIS.includes(quem.toLowerCase() as Responsavel) && <Aprovador nome={quem} />}{quem}</>}
    </span>
  );
}
