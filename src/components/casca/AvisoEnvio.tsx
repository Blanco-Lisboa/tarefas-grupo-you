"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { descartarEnvio, tentarEnvioDeNovo, useEnvios, useTarefas, type Envio } from "@/lib/dados";
import "./aviso-envio.css";

// Painel de envios em segundo plano (itens 268 e 281), no estilo do Google Drive: canto de baixo à direita, um item por envio, um abaixo do outro.
// Fechar a aba cancela o envio, então o navegador pergunta antes. O painel só fecha quando nada está subindo.
const NO_AR = (e: Envio) => e.estado === "fila" || e.estado === "enviando";
const ROTULO = { fila: "Na fila", enviando: "Enviando", enviado: "Enviado", falhou: "Falhou", interrompido: "Interrompido" } as const;

export function AvisoEnvio() {
  const envios = useEnvios();
  const titulos = new Map(useTarefas().map((t) => [t.id, t.titulo]));
  const [minimizado, setMinimizado] = useState(false);
  const andando = envios.filter(NO_AR).length;
  useEffect(() => {
    if (!andando) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [andando]);
  if (!envios.length) return null;
  const resumo = andando ? `Enviando ${andando} ${andando === 1 ? "vídeo" : "vídeos"}` : envios.some((e) => e.estado === "falhou" || e.estado === "interrompido") ? "Envio com problema" : "Envios concluídos";
  return (
    <section className="envios" aria-label="Envios em segundo plano" data-minimizado={minimizado || undefined}>
      <header>
        <h2 aria-live="polite">{resumo}</h2>
        <button type="button" aria-label={minimizado ? "Expandir envios" : "Minimizar envios"} aria-expanded={!minimizado} onClick={() => setMinimizado(!minimizado)}>{minimizado ? "▴" : "▾"}</button>
        <button type="button" aria-label="Fechar painel de envios" disabled={!!andando} title={andando ? "Espere os envios terminarem" : undefined} onClick={() => { envios.forEach((e) => descartarEnvio(e.id)); }}>×</button>
      </header>
      {!minimizado && (
        <ul>
          {envios.map((e) => (
            <li key={e.id} data-estado={e.estado}>
              <span className="envios-nome" title={e.nome}>{(e.tarefaId && titulos.get(e.tarefaId)) || "Card"}<small>{e.nome}</small></span>
              <b>{e.estado === "enviando" ? `${Math.round(e.fracao * 100)}%` : ROTULO[e.estado]}</b>
              {NO_AR(e) && <span className="envios-barra" role="progressbar" aria-label={`Enviando ${e.nome}`} aria-valuenow={Math.round(e.fracao * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${e.fracao * 100}%` }} /></span>}
              {e.estado === "falhou" && <button type="button" onClick={() => tentarEnvioDeNovo(e.id)} title={e.erro}>Tentar de novo</button>}
              {e.estado === "interrompido" && (
                <>
                  <small className="envios-aviso">Envio interrompido. Escolha o vídeo de novo.</small>
                  {e.tarefaId && <Link href={`/conteudos?ficha=${e.tarefaId}`} onClick={() => { window.dispatchEvent(new CustomEvent("grade:ficha", { detail: e.tarefaId })); descartarEnvio(e.id); }}>Abrir o card</Link>}
                </>
              )}
              {!NO_AR(e) && <button type="button" aria-label={`Tirar ${e.nome} da lista`} onClick={() => descartarEnvio(e.id)}>×</button>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
