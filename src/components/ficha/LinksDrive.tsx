"use client";
// Links do Drive da ficha: nome + endereço, "Abrir" só quando o endereço começa com http(s). A ficha limpa os vazios ao salvar.
import type { Link } from "@/lib/dados";

export const LINK_VALIDO = /^https?:\/\//i;

export function LinksDrive({ links, aoMudar }: { links: Link[]; aoMudar: (v: Link[]) => void }) {
  return (
    <fieldset className="ficha-campo">
      <legend>Links do Drive</legend>
      {links.map((l, i) => (
        <div key={i} className="ficha-link">
          <input aria-label="Nome do link" value={l.rotulo} placeholder="Nome" onChange={(e) => aoMudar(links.map((x, j) => (j === i ? { ...x, rotulo: e.target.value } : x)))} />
          <input aria-label="Endereço do link" type="url" value={l.url} placeholder="https://drive.google.com/..." onChange={(e) => aoMudar(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
          {LINK_VALIDO.test(l.url) && <a href={l.url} target="_blank" rel="noreferrer noopener">Abrir</a>}
          <button type="button" className="ficha-texto-botao" onClick={() => aoMudar(links.filter((_, j) => j !== i))}>Tirar</button>
        </div>
      ))}
      <button type="button" className="ficha-texto-botao" onClick={() => aoMudar([...links, { rotulo: "", url: "" }])}>+ Adicionar link</button>
    </fieldset>
  );
}
