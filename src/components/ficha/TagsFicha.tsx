"use client";
// Tags e "Quem aprova" da ficha (saíram da Ficha.tsx para ela caber no limite de linhas; comportamento igual).
// "Nova tag" troca a linha por nome + cores; "Novo nome" (de quem aprova) troca por um campo de nome. Esc cancela sem fechar a ficha.
// `aprovadorTravado`: só o Natham, o Matheus ou quem aprova muda o aprovador (015, 223).
import { useState } from "react";
import { APROVADORES, ETIQUETAS, salvarTag, useTags, useTarefas, type Etiqueta, type NovaTarefa } from "@/lib/dados";
import { Selecao } from "@/components/ui/Selecao";
import { Aprovador, TagChip } from "@/components/ui/Tag";

export function TagsFicha({ t, mudar, pedeAprovador, aprovadorTravado }: {
  t: NovaTarefa; mudar: <K extends keyof NovaTarefa>(campo: K, valor: NovaTarefa[K]) => void; pedeAprovador: boolean; aprovadorTravado: boolean;
}) {
  const tags = useTags();
  const todas = useTarefas();
  const [novaTag, setNovaTag] = useState<{ nome: string; cor: Etiqueta } | null>(null);
  const [novoNome, setNovoNome] = useState<string | null>(null);
  const marcadas = t.tags ?? [];
  const aprovadores = [...new Set<string>([...APROVADORES, ...todas.flatMap((x) => (x.aprovador ? [x.aprovador] : [])), ...(t.aprovador ? [t.aprovador] : [])])];
  async function criarTag() {
    if (!novaTag?.nome.trim()) return;
    const g = await salvarTag({ nome: novaTag.nome.trim(), cor: novaTag.cor });
    mudar("tags", [...marcadas, g.id]);
    setNovaTag(null);
  }

  return (
    <div className="ficha-tags">
      {novaTag ? (
        <div className="ficha-campo ficha-tag-nova">
          <input aria-label="Nome da nova tag" placeholder="Nome da nova tag" value={novaTag.nome} autoFocus
            onChange={(e) => setNovaTag({ ...novaTag, nome: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void criarTag(); } if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setNovaTag(null); } }} />
          <div className="ficha-cores">
            {[...ETIQUETAS.slice(0, 6), ...ETIQUETAS.slice(10, 16)].map((c) => (
              <button key={c} type="button" className="ficha-cor" aria-label={`Cor ${c.slice(9)}`} aria-pressed={novaTag.cor === c} style={{ background: `var(--${c})` }} onClick={() => setNovaTag({ ...novaTag, cor: c })} />
            ))}
          </div>
          <button type="button" className="ficha-texto-botao" onClick={() => void criarTag()}>Criar</button>
          <button type="button" className="ficha-mais" aria-label="Cancelar" onClick={() => setNovaTag(null)}>×</button>
        </div>
      ) : novoNome !== null ? (
        <div className="ficha-campo ficha-tag-nova">
          <input aria-label="Nome de quem aprova" placeholder="Nome de quem aprova" value={novoNome} autoFocus
            onChange={(e) => setNovoNome(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); if (novoNome.trim()) mudar("aprovador", novoNome.trim()); setNovoNome(null); }
              if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setNovoNome(null); }
            }} />
          <button type="button" className="ficha-texto-botao" onClick={() => { if (novoNome.trim()) mudar("aprovador", novoNome.trim()); setNovoNome(null); }}>Adicionar</button>
          <button type="button" className="ficha-mais" aria-label="Cancelar" onClick={() => setNovoNome(null)}>×</button>
        </div>
      ) : (
        <>
          <div className="ficha-campo ficha-escolha">
            <Selecao rotulo="Tags" opcoes={tags.map((g) => ({ valor: g.id, rotulo: g.nome, antes: <span className="ficha-ponto" style={{ background: `var(--${g.cor})` }} />, chip: <TagChip tag={g} /> }))} valor={marcadas} aoMudar={(v) => mudar("tags", v)} acao={{ rotulo: "Nova tag", aoClicar: () => setNovaTag({ nome: "", cor: "etiqueta-3" }) }} />
          </div>
          {pedeAprovador && (
            <div className="ficha-campo ficha-escolha" inert={aprovadorTravado} title={aprovadorTravado ? "Só o Natham, o Matheus ou quem aprova muda" : undefined}>
              <Selecao rotulo="Quem aprova" opcoes={aprovadores.map((nome) => ({ valor: nome, rotulo: nome, antes: <Aprovador nome={nome} tamanho={18} /> }))} valor={t.aprovador ? [t.aprovador] : []} multipla={false} rotuloTodos="Ninguém" aoMudar={([v]) => mudar("aprovador", v)} acao={{ rotulo: "Novo nome", aoClicar: () => setNovoNome("") }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
