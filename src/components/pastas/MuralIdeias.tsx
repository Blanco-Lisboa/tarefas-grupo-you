"use client";
import { useRef, useState, type CSSProperties, type DragEvent, type KeyboardEvent } from "react";
import { useIdeias, type Ideia } from "@/lib/dados";
import { CardFlutuante } from "./CardFlutuante";

// Pasta "Ideias de conteúdo" aberta como Mural de folhas (item 247): todas as ideias da empresa, uma coluna por categoria.
// Escrever na folha salva ao sair do campo; arrastar pelo cabo muda a categoria. Tudo passa por useIdeias (mesmo caminho de antes).
const nIdeias = (n: number) => (n === 1 ? "1 ideia" : `${n} ideias`);
const sem = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const linkValido = (l?: string) => !!l && /^https?:\/\//i.test(l);

type Dados = Omit<Ideia, "empresaId" | "id"> & { id?: string };

export function MuralIdeias({ empresaId, nome, tom, aoFechar }: { empresaId: string; nome: string; tom: string; aoFechar: () => void }) {
  const { ideias, salvar, apagar } = useIdeias(empresaId);
  const [busca, setBusca] = useState("");
  const [extras, setExtras] = useState<string[]>([]); // categorias novas, ainda sem ideia
  const [foco, setFoco] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<string | null>(null);

  const q = sem(busca.trim());
  const acha = (i: Ideia) => !q || sem(`${i.titulo} ${i.texto} ${i.link ?? ""} ${i.categoria}`).includes(q);
  const todas = [...new Set([...ideias.map((i) => i.categoria), ...extras])];
  const colunas = todas.map((cat) => ({ cat, itens: ideias.filter((i) => i.categoria === cat && acha(i)) })).filter((c) => !q || c.itens.length);
  const achadas = colunas.reduce((s, c) => s + c.itens.length, 0);

  const soltar = (cat: string) => {
    const i = ideias.find((x) => x.id === arrastando);
    setArrastando(null);
    setAlvo(null);
    if (i && i.categoria !== cat) salvar({ ...i, categoria: cat });
  };

  return (
    <CardFlutuante titulo={`Ideias de conteúdo · ${nome}`} aoFechar={aoFechar} classe="mural">
      <div className="mural-barra">
        <input type="search" className="mural-busca" placeholder="Buscar nas ideias" aria-label="Buscar nas ideias" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <span className="mural-conta">{q ? `${nIdeias(achadas)} achadas` : nIdeias(ideias.length)}</span>
      </div>
      <div className="mural-quadro" style={{ "--mural-tom": tom } as CSSProperties}>
        {colunas.map(({ cat, itens }) => (
          <section
            key={cat}
            className="mural-col"
            aria-label={cat}
            data-alvo={alvo === cat || undefined}
            onDragOver={(e) => { if (arrastando) { e.preventDefault(); setAlvo(cat); } }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setAlvo(null); }}
            onDrop={(e) => { e.preventDefault(); soltar(cat); }}
          >
            <h3>{cat} <small>{itens.length}</small></h3>
            <div className="mural-folhas">
              {itens.map((i) => (
                <Folha key={i.id} ideia={i} arrastando={arrastando === i.id} aoSalvar={salvar} aoApagar={() => apagar(i.id)} aoArrastar={setArrastando} aoSoltarFora={() => { setArrastando(null); setAlvo(null); }} />
              ))}
              <Nova categoria={cat} autoFocar={foco === cat} aoCriar={(titulo) => salvar({ categoria: cat, titulo, texto: "" })} />
            </div>
          </section>
        ))}
        {!q && <NovaCategoria existentes={todas} aoCriar={(c) => { setExtras((e) => [...e, c]); setFoco(c); }} />}
        {q && colunas.length === 0 && <p className="mural-vazio">Nenhuma ideia com “{busca.trim()}”.</p>}
      </div>
    </CardFlutuante>
  );
}

function Folha({ ideia, arrastando, aoSalvar, aoApagar, aoArrastar, aoSoltarFora }: {
  ideia: Ideia; arrastando: boolean; aoSalvar: (d: Dados) => void; aoApagar: () => void; aoArrastar: (id: string) => void; aoSoltarFora: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const folha = useRef<HTMLElement>(null);
  const sair = (campo: "titulo" | "texto" | "link") => (e: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) => {
    const v = e.currentTarget.value.trim();
    if (campo === "titulo" && !v) { e.currentTarget.value = ideia.titulo; return; } // ideia sem título não existe: volta o que estava
    if (v !== (ideia[campo] ?? "")) aoSalvar({ ...ideia, [campo]: campo === "link" ? v || undefined : v });
  };
  const levantar = (e: DragEvent) => {
    e.dataTransfer.setData("text/plain", ideia.id);
    e.dataTransfer.effectAllowed = "move";
    if (folha.current) e.dataTransfer.setDragImage(folha.current, 24, 16);
    aoArrastar(ideia.id);
  };
  return (
    <article ref={folha} className="mural-folha" data-arrastando={arrastando || undefined}>
      <div className="mural-folha-topo">
        <span className="mural-cabo" draggable onDragStart={levantar} onDragEnd={aoSoltarFora} title="Arraste para outra categoria" aria-label="Arrastar para outra categoria" />
        <button type="button" className="mural-apagar" aria-label={`Apagar ideia ${ideia.titulo}`} onClick={() => setConfirmando(true)}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8h5.8l.6-8" /></svg>
        </button>
      </div>
      <input className="mural-titulo" aria-label="Título" maxLength={120} defaultValue={ideia.titulo} onBlur={sair("titulo")} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} />
      <textarea className="mural-detalhe" aria-label="Detalhe" rows={2} placeholder="Detalhe" defaultValue={ideia.texto} onBlur={sair("texto")} />
      <div className="mural-link">
        <input type="url" aria-label="Link de referência" placeholder="Link de referência" defaultValue={ideia.link} onBlur={sair("link")} />
        {linkValido(ideia.link) && <a className="lnk" href={ideia.link} target="_blank" rel="noopener noreferrer">Abrir</a>}
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
