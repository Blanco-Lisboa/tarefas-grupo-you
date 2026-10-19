"use client";
import { useState, type FormEvent } from "react";
import { useIdeias, type Ideia } from "@/lib/dados";
import { Selecao } from "@/components/ui/Selecao";
import { CardFlutuante } from "./CardFlutuante";
import { semLinks, TextoComLinks } from "./links";

// Pasta "Ideias de conteúdo" (modelo: Ideias do Yougram do CRM): categorias, ideias de cada uma, "Ver referência".
type Vista = { v: "categorias" } | { v: "categoria"; cat: string } | { v: "ideia"; id: string } | { v: "form"; id?: string; cat?: string };
const NOVA = "__nova__";

const nIdeias = (n: number) => (n === 1 ? "1 ideia" : `${n} ideias`);

export function CardIdeias({ empresaId, inicio, aoFechar }: { empresaId: string; inicio?: string; aoFechar: () => void }) {
  const { ideias, salvar } = useIdeias(empresaId);
  const [vista, setVista] = useState<Vista>(inicio ? { v: "categoria", cat: inicio } : { v: "categorias" });
  const categorias = [...new Set(ideias.map((i) => i.categoria))];
  const da = (cat: string) => ideias.filter((i) => i.categoria === cat);

  const idAtual = vista.v === "ideia" || vista.v === "form" ? vista.id : undefined;
  const ideia = ideias.find((i) => i.id === idAtual);
  const titulo =
    vista.v === "categoria" ? vista.cat : vista.v === "ideia" ? (semLinks(ideia?.titulo ?? "Ideia")) : vista.v === "form" ? (vista.id ? "Editar ideia" : "Nova ideia") : "Ideias de conteúdo";
  // Voltar sobe um degrau: ideia -> categoria dela -> categorias; formulário -> a ideia que se edita ou a categoria de onde veio.
  const acima: Vista | undefined =
    vista.v === "categoria" ? { v: "categorias" }
    : vista.v === "ideia" ? { v: "categoria", cat: ideia?.categoria ?? "" }
    : vista.v === "form" ? (ideia ? { v: "ideia", id: ideia.id } : vista.cat ? { v: "categoria", cat: vista.cat } : { v: "categorias" })
    : undefined;
  const voltar = acima && (() => setVista(acima));

  return (
    <CardFlutuante titulo={titulo} aoFechar={aoFechar} voltar={voltar}>
      {vista.v === "categorias" && (
        <>
          <button type="button" className="btn ideias-nova" onClick={() => setVista({ v: "form" })}>+ Ideia</button>
          <ul className="ideias-cats">
            {categorias.map((cat) => (
              <li key={cat}>
                <button type="button" onClick={() => setVista({ v: "categoria", cat })}>
                  <strong>{cat}</strong>
                  <span>{nIdeias(da(cat).length)}</span>
                  <small>{semLinks(da(cat)[0]?.titulo ?? "")}</small>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {vista.v === "categoria" && (
        <>
          <button type="button" className="btn ideias-nova" onClick={() => setVista({ v: "form", cat: vista.cat })}>+ Ideia</button>
          <ul className="ideias-lista">
            {da(vista.cat).map((i) => (
              <li key={i.id}>
                <button type="button" onClick={() => setVista({ v: "ideia", id: i.id })}>
                  <strong>{semLinks(i.titulo)}</strong>
                  <span>{semLinks(i.texto)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {vista.v === "ideia" && ideia && (
        <article className="ideia-aberta">
          <p className="ideia-cat">{ideia.categoria}</p>
          <p className="ideia-texto">{ideia.texto ? <TextoComLinks texto={ideia.texto} /> : "Sem detalhe."}</p>
          <div className="ideia-acoes">
            {ideia.link && <a className="btn" href={ideia.link} target="_blank" rel="noopener noreferrer">Ver referência</a>}
            <button type="button" className="btn btn-2" onClick={() => setVista({ v: "form", id: ideia.id })}>Editar</button>
          </div>
        </article>
      )}

      {vista.v === "form" && (
        <Formulario
          key={vista.id ?? "nova"}
          ideia={ideia}
          categorias={categorias}
          categoriaInicial={vista.cat ?? categorias[0]}
          aoSalvar={(d) => {
            const s = salvar({ ...d, id: ideia?.id });
            setVista({ v: "ideia", id: s.id });
          }}
        />
      )}
    </CardFlutuante>
  );
}

function Formulario({ ideia, categorias, categoriaInicial, aoSalvar }: {
  ideia?: Ideia;
  categorias: string[];
  categoriaInicial: string;
  aoSalvar: (d: Omit<Ideia, "id" | "empresaId">) => void;
}) {
  const [cat, setCat] = useState(ideia?.categoria ?? categoriaInicial);
  const [nova, setNova] = useState("");
  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const categoria = cat === NOVA ? nova.trim() : cat;
    if (!categoria) return;
    aoSalvar({ categoria, titulo: String(f.get("titulo")).trim(), texto: String(f.get("texto")).trim(), link: String(f.get("link")).trim() || undefined });
  };
  const opcoes = [...categorias.map((c) => ({ valor: c, rotulo: c })), { valor: NOVA, rotulo: "Nova categoria..." }];

  return (
    <form className="ideia-form" onSubmit={enviar}>
      <label>Título<input name="titulo" required maxLength={120} defaultValue={ideia?.titulo} autoFocus /></label>
      <label>Detalhe (opcional)<textarea name="texto" rows={5} defaultValue={ideia?.texto} /></label>
      <label>Link de referência (opcional)<input name="link" type="url" placeholder="https://" defaultValue={ideia?.link} /></label>
      <Selecao rotulo="Categoria" opcoes={opcoes} valor={[cat]} aoMudar={(v) => v[0] && setCat(v[0])} multipla={false} />
      {cat === NOVA && <label>Nome da categoria<input value={nova} onChange={(e) => setNova(e.target.value)} required maxLength={60} /></label>}
      <button type="submit" className="btn">{ideia ? "Salvar" : "+ Ideia"}</button>
    </form>
  );
}
