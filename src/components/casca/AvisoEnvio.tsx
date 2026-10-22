"use client";
import Link from "next/link";
import { useEffect } from "react";
import { descartarEnvio, tentarEnvioDeNovo, useEnvios } from "@/lib/dados";
import "./aviso-envio.css";

// Aviso do envio em segundo plano (item 268): canto de baixo, em qualquer tela. Fechar a aba cancela o envio, então o navegador pergunta antes.
export function AvisoEnvio() {
  const envios = useEnvios();
  const andando = envios.some((e) => e.estado === "fila" || e.estado === "enviando");
  useEffect(() => {
    if (!andando) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [andando]);
  if (!envios.length) return null;
  return (
    <ul className="aviso-envio" aria-live="polite" aria-label="Envios em segundo plano">
      {envios.map((e) => (
        <li key={e.id} data-estado={e.estado}>
          <span className="aviso-envio-nome" title={e.nome}>{e.nome}</span>
          {e.estado === "enviado" ? <b>Enviado</b>
            : e.estado === "interrompido" ? (
              <>
                <b>Envio interrompido — escolha o vídeo de novo</b>
                {e.tarefaId && <Link href={`/conteudos?ficha=${e.tarefaId}`} onClick={() => descartarEnvio(e.id)}>Abrir o card</Link>}
                <button type="button" aria-label={`Descartar ${e.nome}`} onClick={() => descartarEnvio(e.id)}>×</button>
              </>
            )
            : e.estado === "falhou" ? (
              <>
                <b title={e.erro}>Falhou</b>
                <button type="button" onClick={() => tentarEnvioDeNovo(e.id)}>Tentar de novo</button>
                <button type="button" aria-label={`Descartar ${e.nome}`} onClick={() => descartarEnvio(e.id)}>×</button>
              </>
            ) : (
              <>
                <b>{e.estado === "fila" ? "Na fila" : `${Math.round(e.fracao * 100)}%`}</b>
                <span className="aviso-envio-barra" role="progressbar" aria-label={`Enviando ${e.nome}`} aria-valuenow={Math.round(e.fracao * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${e.fracao * 100}%` }} /></span>
              </>
            )}
        </li>
      ))}
    </ul>
  );
}
