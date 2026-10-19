"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Arquivo, Peca } from "@/lib/dados";
import { Anexos } from "@/components/ficha/Anexos";
import "@/components/ficha/ficha.css";
import { CardFlutuante } from "./CardFlutuante";

type Dados = Omit<Peca, "id" | "empresaId" | "tipo" | "pastaId">;

// Folha nova (sem `peca`) ou edição de uma folha: nome, formato, imagem ou vídeo, link do Drive e notas.
export function CardFolha({ peca, emUso, aoSalvar, aoFechar }: { peca?: Peca; emUso: (titulo: string) => boolean; aoSalvar: (d: Dados) => void; aoFechar: () => void }) {
  const [arquivo, setArquivo] = useState<Arquivo | undefined>(peca?.arquivo);
  const [erro, setErro] = useState("");
  const campo = useRef<HTMLInputElement>(null);
  // o <dialog> só abre depois deste efeito e leva o foco para o X: o foco no campo vem em seguida
  useEffect(() => {
    const t = setTimeout(() => campo.current?.focus());
    return () => clearTimeout(t);
  }, []);
  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const titulo = String(f.get("titulo")).trim();
    if (!titulo) return setErro("Escreva um nome para a folha.");
    if (emUso(titulo)) return setErro("Já existe uma folha com esse nome nesta pasta.");
    aoSalvar({ titulo, meta: String(f.get("meta")).trim() || undefined, link: String(f.get("link")).trim() || undefined, notas: String(f.get("notas")).trim() || undefined, arquivo });
  };
  return (
    <CardFlutuante titulo={peca ? "Editar folha" : "Nova folha"} aoFechar={aoFechar}>
      <form className="ideia-form" onSubmit={enviar}>
        <label>Nome<input ref={campo} name="titulo" maxLength={80} defaultValue={peca?.titulo} aria-invalid={!!erro} onChange={() => setErro("")} /></label>
        <label>Formato (opcional)<input name="meta" maxLength={60} placeholder="PNG 1080x1350" defaultValue={peca?.meta} /></label>
        <Anexos valor={arquivo ? [arquivo] : []} aoMudar={(v) => setArquivo(v.at(-1))} />
        <label>Link do Drive (opcional)<input name="link" type="url" placeholder="https://" defaultValue={peca?.link} /></label>
        <label>Notas (opcional)<textarea name="notas" rows={3} defaultValue={peca?.notas} /></label>
        {erro && <p className="pasta-erro" role="alert">{erro}</p>}
        <button type="submit" className="btn">{peca ? "Salvar" : "Criar folha"}</button>
      </form>
    </CardFlutuante>
  );
}
