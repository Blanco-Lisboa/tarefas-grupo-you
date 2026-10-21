"use client";
// Tags e "Quem aprova" da ficha (saíram da Ficha.tsx para ela caber no limite de linhas; comportamento igual).
// "Nova tag" troca a linha por nome + cores; "Novo nome" (de quem aprova) troca por um campo de nome. Esc cancela sem fechar a ficha.
// `aprovadorTravado`: só o Natham, o Matheus ou quem aprova muda o aprovador (015, 223).
// Item 242: na lista, cada tag tem lápis (abre a mesma linha da "Nova tag", já preenchida) e lixeira (com confirmação de quantos cards ela sai),
// para o Natham e o Matheus. A tag do sistema ("Esperando aprovação", liga o Quem aprova) só mostra um cadeado.
import { useState } from "react";
import { APROVADORES, ETIQUETAS, editarTag, excluirTag, salvarTag, useEu, useTags, useTarefas, type Etiqueta, type NovaTarefa, type Tag } from "@/lib/dados";
import { Selecao } from "@/components/ui/Selecao";
import { Aprovador, TagChip } from "@/components/ui/Tag";
import { Cadeado } from "./CampoOcasiao";
import { Confirmar } from "./Confirmar";

const fecharLista = (e: { currentTarget: HTMLElement }) => (e.currentTarget.closest("[popover]") as HTMLElement | null)?.hidePopover();

export function TagsFicha({ t, mudar, pedeAprovador, aprovadorTravado }: {
  t: NovaTarefa; mudar: <K extends keyof NovaTarefa>(campo: K, valor: NovaTarefa[K]) => void; pedeAprovador: boolean; aprovadorTravado: boolean;
}) {
  const tags = useTags();
  const todas = useTarefas();
  const eu = useEu();
  const mexeTags = eu === "natham" || eu === "matheus";
  const [novaTag, setNovaTag] = useState<{ id?: string; nome: string; cor: Etiqueta } | null>(null); // com id = editando essa tag
  const [excluindo, setExcluindo] = useState<Tag | null>(null);
  const [novoNome, setNovoNome] = useState<string | null>(null);
  const marcadas = t.tags ?? [];
  const aprovadores = [...new Set<string>([...APROVADORES, ...todas.flatMap((x) => (x.aprovador ? [x.aprovador] : [])), ...(t.aprovador ? [t.aprovador] : [])])];
  async function criarTag() {
    if (!novaTag?.nome.trim()) return;
    if (novaTag.id) await editarTag(novaTag.id, { nome: novaTag.nome.trim(), cor: novaTag.cor });
    else mudar("tags", [...marcadas, (await salvarTag({ nome: novaTag.nome.trim(), cor: novaTag.cor })).id]);
    setNovaTag(null);
  }
  const emQuantos = (id: string) => todas.filter((x) => x.tags?.includes(id)).length;
  const acoesDa = (g: Tag) => g.aprovacao
    ? <span className="ficha-tag-sistema" title="Tag do sistema: liga o Quem aprova. Não se edita nem se exclui."><Cadeado /></span>
    : mexeTags && <>
      <button type="button" className="ficha-tag-acao" aria-label={`Editar a tag ${g.nome}`} title="Editar" onClick={(e) => { fecharLista(e); setNovaTag({ id: g.id, nome: g.nome, cor: g.cor }); }}>
        <svg viewBox="0 0 24 24" aria-hidden><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" /></svg>
      </button>
      <button type="button" className="ficha-tag-acao" data-perigo aria-label={`Excluir a tag ${g.nome}`} title="Excluir" onClick={(e) => { fecharLista(e); setExcluindo(g); }}>
        <svg viewBox="0 0 20 20" aria-hidden><path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6M8.5 9v4M11.5 9v4" /></svg>
      </button>
    </>;

  return (
    <div className="ficha-tags">
      {novaTag ? (
        <div className="ficha-campo ficha-tag-nova">
          <input aria-label={novaTag.id ? "Nome da tag" : "Nome da nova tag"} placeholder="Nome da nova tag" value={novaTag.nome} autoFocus
            onChange={(e) => setNovaTag({ ...novaTag, nome: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void criarTag(); } if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setNovaTag(null); } }} />
          <div className="ficha-cores">
            {[...ETIQUETAS.slice(0, 6), ...ETIQUETAS.slice(10, 16)].map((c) => (
              <button key={c} type="button" className="ficha-cor" aria-label={`Cor ${c.slice(9)}`} aria-pressed={novaTag.cor === c} style={{ background: `var(--${c})` }} onClick={() => setNovaTag({ ...novaTag, cor: c })} />
            ))}
          </div>
          <button type="button" className="ficha-texto-botao" onClick={() => void criarTag()}>{novaTag.id ? "Salvar" : "Criar"}</button>
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
            <Selecao rotulo="Tags" opcoes={tags.map((g) => ({ valor: g.id, rotulo: g.nome, antes: <span className="ficha-ponto" style={{ background: `var(--${g.cor})` }} />, chip: <TagChip tag={g} />, depois: acoesDa(g) || undefined }))} valor={marcadas} aoMudar={(v) => mudar("tags", v)} acao={{ rotulo: "Nova tag", aoClicar: () => setNovaTag({ nome: "", cor: "etiqueta-3" }) }} />
          </div>
          {pedeAprovador && (
            <div className="ficha-campo ficha-escolha" inert={aprovadorTravado} title={aprovadorTravado ? "Só o Natham, o Matheus ou quem aprova muda" : undefined}>
              <Selecao rotulo="Quem aprova" opcoes={aprovadores.map((nome) => ({ valor: nome, rotulo: nome, antes: <Aprovador nome={nome} tamanho={18} /> }))} valor={t.aprovador ? [t.aprovador] : []} multipla={false} rotuloTodos="Ninguém" aoMudar={([v]) => mudar("aprovador", v)} acao={{ rotulo: "Novo nome", aoClicar: () => setNovoNome("") }} />
            </div>
          )}
        </>
      )}
      {excluindo && (
        <Confirmar titulo={`Excluir a tag ${excluindo.nome}?`} acao="Excluir" perigo
          texto={((n) => (n ? `Ela sai de ${n} ${n === 1 ? "card" : "cards"}.` : "Nenhum card usa esta tag."))(emQuantos(excluindo.id))}
          aoCancelar={() => setExcluindo(null)}
          aoConfirmar={() => { const id = excluindo.id; setExcluindo(null); if (marcadas.includes(id)) mudar("tags", marcadas.filter((x) => x !== id)); void excluirTag(id); }} />
      )}
    </div>
  );
}
