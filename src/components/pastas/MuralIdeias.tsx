"use client";
import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { useIdeias, type Ideia } from "@/lib/dados";
import { CabecalhoColuna } from "@/components/ui/CabecalhoColuna";
import { IconeRede } from "@/components/ui/Marca";
import { CardFlutuante } from "./CardFlutuante";

// Pasta "Ideias de conteúdo" aberta como Mural de folhas (item 247): todas as ideias da empresa, uma coluna por categoria.
// Escrever na folha salva ao sair do campo. A ideia nasce numa coluna e fica nela até ser apagada (item 249). Tudo passa por useIdeias.
const nIdeias = (n: number) => (n === 1 ? "1 ideia" : `${n} ideias`);
const sem = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const linkValido = (l?: string) => !!l && /^https?:\/\//i.test(l);
// Rede do link, só para mostrar o ícone: Instagram, TikTok ou YouTube. Outro endereço fica sem ícone.
const redeDoLink = (l: string) => {
  try {
    const h = new URL(l).hostname.replace(/^(www|m|vm)\./, "");
    return h.endsWith("instagram.com") ? "instagram" : h.endsWith("tiktok.com") ? "tiktok" : h.endsWith("youtube.com") || h === "youtu.be" ? "youtube" : null;
  } catch {
    return null;
  }
};

type Dados = Omit<Ideia, "empresaId" | "id"> & { id?: string };

export function MuralIdeias({ empresaId, nome, tom, aoFechar }: { empresaId: string; nome: string; tom: string; aoFechar: () => void }) {
  const { ideias, categorias: todas, salvar, apagar, criarCategoria } = useIdeias(empresaId);
  const [busca, setBusca] = useState("");
  const [foco, setFoco] = useState<string | null>(null);

  const q = sem(busca.trim());
  const acha = (i: Ideia) => !q || sem(`${i.titulo} ${i.texto} ${i.link ?? ""} ${i.categoria}`).includes(q);
  const colunas = todas.map((cat) => ({ cat, itens: ideias.filter((i) => i.categoria === cat && acha(i)) })).filter((c) => !q || c.itens.length);
  const achadas = colunas.reduce((s, c) => s + c.itens.length, 0);


  return (
    <CardFlutuante titulo={`Ideias de conteúdo · ${nome}`} aoFechar={aoFechar} classe="mural">
      <div className="mural-barra">
        <input type="search" className="mural-busca" placeholder="Buscar nas ideias" aria-label="Buscar nas ideias" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <span className="mural-conta">{q ? `${nIdeias(achadas)} achadas` : nIdeias(ideias.length)}</span>
      </div>
      <div className="mural-quadro" style={{ "--mural-tom": tom } as CSSProperties}>
        {colunas.map(({ cat, itens }, n) => (
          <section
            key={cat}
            className="mural-col"
            aria-label={cat}
          >
            <CabecalhoColuna numero={n + 1} titulo={cat} total={itens.length} rotuloNovo={`Nova ideia em ${cat}`} aoNovo={() => document.querySelector<HTMLInputElement>(`input[aria-label="${CSS.escape("Nova ideia em " + cat)}"]`)?.focus()} />
            <div className="mural-folhas">
              {itens.map((i) => (
                <Folha key={i.id} ideia={i} aoSalvar={salvar} aoApagar={() => apagar(i.id)} />
              ))}
              <Nova categoria={cat} autoFocar={foco === cat} aoCriar={(titulo) => salvar({ categoria: cat, titulo, texto: "" })} />
            </div>
          </section>
        ))}
        {!q && <NovaCategoria existentes={todas} aoCriar={(c) => { criarCategoria(c); setFoco(c); }} />}
        {q && colunas.length === 0 && <p className="mural-vazio">Nenhuma ideia com “{busca.trim()}”.</p>}
      </div>
    </CardFlutuante>
  );
}

function Folha({ ideia, aoSalvar, aoApagar }: { ideia: Ideia; aoSalvar: (d: Dados) => void; aoApagar: () => void }) {
  const [confirmando, setConfirmando] = useState(false);
  const [editandoLink, setEditandoLink] = useState(false);
  const sair = (campo: "titulo" | "texto" | "link") => (e: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) => {
    const v = e.currentTarget.value.trim();
    if (campo === "titulo" && !v) { e.currentTarget.value = ideia.titulo; return; } // ideia sem título não existe: volta o que estava
    if (v !== (ideia[campo] ?? "")) aoSalvar({ ...ideia, [campo]: campo === "link" ? v || undefined : v });
  };
  const temLink = linkValido(ideia.link);
  const rede = temLink ? redeDoLink(ideia.link!) : null;
  return (
    <article className="mural-folha">
      <div className="mural-folha-topo">
        <textarea className="mural-titulo" aria-label="Título" rows={1} maxLength={120} defaultValue={ideia.titulo} onBlur={sair("titulo")} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())} />
        <button type="button" className="mural-apagar" aria-label={`Apagar ideia ${ideia.titulo}`} onClick={() => setConfirmando(true)}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8h5.8l.6-8" /></svg>
        </button>
      </div>
      <textarea className="mural-detalhe" aria-label="Detalhe" rows={2} placeholder="Detalhe" defaultValue={ideia.texto} onBlur={sair("texto")} />
      <div className="mural-rodape" data-vazio={!temLink && !editandoLink ? true : undefined}>
        {temLink && !editandoLink && (
          <a className="lnk mural-ver" href={ideia.link} target="_blank" rel="noopener noreferrer">
            {rede && <IconeRede rede={rede} tamanho={14} />}Ver referência
          </a>
        )}
        {!temLink || editandoLink ? (
          <input
            type="url"
            className="mural-link-campo"
            aria-label="Link de referência"
            placeholder="Colar link de referência"
            defaultValue={ideia.link}
            autoFocus={editandoLink}
            onBlur={(e) => { sair("link")(e); setEditandoLink(false); }}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
          />
        ) : (
          <button type="button" className="mural-trocar" aria-label="Trocar o link de referência" title="Trocar o link" onClick={() => setEditandoLink(true)}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 13.5l.7-3L10.8 3a1.4 1.4 0 012 2l-7.6 7.6-2.7.9zM9.5 4.3l2.2 2.2" /></svg>
          </button>
        )}
      </div>
      {confirmando && (
        <div className="mural-confirma" role="alertdialog" aria-label="Apagar ideia">
          <p>Apagar esta ideia?</p>
          <div className="ideia-acoes">
            <button type="button" className="btn pasta-perigo" onClick={aoApagar}>Apagar</button>
            <button type="button" className="btn btn-2" autoFocus onClick={() => setConfirmando(false)}>Manter</button>
          </div>
        </div>
      )}
    </article>
  );
}

// Folha em branco: Enter (ou sair do campo com texto) cria a ideia e deixa a próxima em branco, já com o cursor.
function Nova({ categoria, autoFocar, aoCriar }: { categoria: string; autoFocar: boolean; aoCriar: (titulo: string) => void }) {
  const [texto, setTexto] = useState("");
  const criar = () => {
    const t = texto.trim();
    if (t) aoCriar(t);
    setTexto("");
  };
  return (
    <div className="mural-folha mural-nova">
      <input
        aria-label={`Nova ideia em ${categoria}`}
        placeholder="+ nova"
        maxLength={120}
        autoFocus={autoFocar}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={criar}
        onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && (e.preventDefault(), criar())}
      />
    </div>
  );
}

function NovaCategoria({ existentes, aoCriar }: { existentes: string[]; aoCriar: (c: string) => void }) {
  const [texto, setTexto] = useState("");
  const criar = () => {
    const c = texto.trim();
    if (c && !existentes.some((e) => sem(e) === sem(c))) aoCriar(c);
    setTexto("");
  };
  return (
    <section className="mural-col mural-col-nova" aria-label="Nova categoria">
      <input aria-label="Nova categoria" placeholder="+ categoria" maxLength={60} value={texto} onChange={(e) => setTexto(e.target.value)} onBlur={criar} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), criar())} />
    </section>
  );
}
