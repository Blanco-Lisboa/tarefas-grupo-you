"use client";
/* eslint-disable @next/next/no-img-element -- o anexo é um endereço temporário do navegador (blob:), next/image não serve */
import { useEffect, useRef, useState, type DragEvent } from "react";
import type { Arquivo } from "@/lib/dados";

// Anexos da tarefa (item 129): imagem, vídeo ou documento (PDF, Word, Excel, PowerPoint, txt, csv), arrastados para cá ou escolhidos no computador.
// O arquivo escolhido espera em `pendente` (com um blob: só para mostrar); quem sobe para o Storage é o salvarTarefa, ao salvar a ficha.
const DOCUMENTO = /^(application\/(pdf|msword|vnd\.ms-excel|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\..+)|text\/(plain|csv))$/;
const ACEITA = (f: File) => f.type.startsWith("image/") || f.type.startsWith("video/") || DOCUMENTO.test(f.type);
const tipoDe = (f: File): Arquivo["tipo"] => (f.type.startsWith("video/") ? "video" : f.type.startsWith("image/") ? "imagem" : "documento");
const CLIPE = "M21 12.5l-8.5 8.5a5.5 5.5 0 01-7.8-7.8L13.2 4.7a3.7 3.7 0 015.2 5.2l-8.5 8.5a1.9 1.9 0 01-2.6-2.6L14.6 7.5";

export function Anexos({ valor, aoMudar }: { valor: Arquivo[]; aoMudar: (v: Arquivo[]) => void }) {
  const entrada = useRef<HTMLInputElement>(null);
  const grande = useRef<HTMLDialogElement>(null);
  const [aberto, setAberto] = useState<Arquivo | null>(null);
  const [sobre, setSobre] = useState(false);

  useEffect(() => {
    if (aberto && !grande.current?.open) grande.current?.showModal();
  }, [aberto]);

  function adicionar(lista: FileList | null) {
    const novos = [...(lista ?? [])].filter(ACEITA).map((f): Arquivo => ({ nome: f.name, url: URL.createObjectURL(f), tipo: tipoDe(f), pendente: f }));
    if (novos.length) aoMudar([...valor, ...novos]);
  }
  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setSobre(false);
    adicionar(e.dataTransfer.files);
  };

  return (
    <div className="ficha-anexos">
      <button
        type="button"
        className="ficha-anexo-solta"
        data-sobre={sobre}
        onClick={() => entrada.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setSobre(true); }}
        onDragLeave={() => setSobre(false)}
        onDrop={soltar}
      >
        <svg viewBox="0 0 24 24" aria-hidden><path d={CLIPE} /></svg>
        Anexos: arraste ou escolha imagem, vídeo ou documento
      </button>
      <input ref={entrada} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" multiple hidden onChange={(e) => { adicionar(e.target.files); e.target.value = ""; }} />
      {valor.map((a, i) => (
        <span key={`${a.url}${i}`} className="ficha-anexo">
          <button type="button" className="ficha-anexo-mini" aria-label={`Abrir ${a.nome} em tamanho grande`} title={a.nome} onClick={() => (a.tipo === "documento" ? window.open(a.url, "_blank", "noopener") : setAberto(a))}>
            {a.tipo === "video" ? <video src={`${a.url}#t=0.1`} muted preload="metadata" /> : a.tipo === "documento" ? <span className="ficha-anexo-doc">{a.nome.split(".").pop()?.slice(0, 4).toUpperCase()}</span> : <img src={a.url} alt="" />}
          </button>
          <button type="button" className="ficha-anexo-tirar" aria-label={`Tirar ${a.nome}`} onClick={() => aoMudar(valor.filter((_, j) => j !== i))}>×</button>
        </span>
      ))}
      {aberto && (
        <dialog ref={grande} className="ficha-grande" aria-label={aberto.nome} onClose={(e) => { e.stopPropagation(); setAberto(null); }} onClick={(e) => e.target === e.currentTarget && grande.current?.close()}>
          {aberto.tipo === "video" ? <video src={aberto.url} controls autoPlay /> : <img src={aberto.url} alt={aberto.nome} />}
          <button type="button" className="ficha-fechar" onClick={() => grande.current?.close()}>Fechar</button>
        </dialog>
      )}
    </div>
  );
}
