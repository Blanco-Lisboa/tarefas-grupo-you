"use client";

import { useEffect, useState } from "react";
import { enderecoLigarGoogle, estadoGoogleDrive } from "@/lib/dados";

// Só o Natham vê (item 203): liga o Google Drive uma vez. Os vídeos e as fotos dos cards vão para o Drive dele.
type Estado = { ligado: boolean; email?: string } | "carregando" | "erro";

export function BlocoGoogleDrive() {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [aviso, setAviso] = useState("");
  const [indo, setIndo] = useState(false);

  useEffect(() => {
    let vivo = true;
    estadoGoogleDrive().then((e) => {
      if (!vivo) return;
      setEstado(e);
      if (new URLSearchParams(window.location.search).get("drive") === "erro") setAviso("Não consegui ligar o Google Drive. Tente de novo."); // o Google devolve para /configuracoes?drive=ok|erro
    }, () => vivo && setEstado("erro"));
    return () => { vivo = false; };
  }, []);

  async function ligar() {
    setIndo(true);
    setAviso("");
    try {
      window.location.assign(await enderecoLigarGoogle());
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Não consegui abrir o Google. Tente de novo.");
      setIndo(false);
    }
  }

  return (
    <section className="config-bloco" aria-labelledby="config-drive-titulo">
      <div className="config-bloco-topo"><h2 id="config-drive-titulo">Google Drive</h2></div>
      <p>
        {estado === "carregando" ? "Conferindo…"
          : estado === "erro" ? "Não consegui conferir o Google Drive agora."
          : estado.ligado ? `Ligado${estado.email ? ` como ${estado.email}` : ""}`
          : "Ainda não está ligado. Ligue para anexar vídeos e fotos nos cards."}
      </p>
      {aviso && <p className="config-erro" role="alert">{aviso}</p>}
      {typeof estado === "object" && !estado.ligado && <button type="button" className="config-botao" disabled={indo} onClick={() => void ligar()}>Ligar Google Drive</button>}
    </section>
  );
}
