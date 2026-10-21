"use client";
// Capa do Reels no Instagram (196), quando não há capa própria: escolhe-se um QUADRO do vídeo numa barrinha.
// Grava só o momento em ms (vai para a Meta como thumb_offset); o vídeo não é mexido. Sem escolha = primeiro quadro.
//   <CapaQuadro key={video.id ?? video.url} video={video} valor={t.capaQuadroMs} aoMudar={(ms) => mudar("capaQuadroMs", ms)} />
// Vídeo ainda não enviado toca do computador (blob:); o que já está no Drive toca pelo link de 10 min do Vitral (linkDeVideo).
import { useEffect, useRef, useState } from "react";
import { linkDeVideo, type Arquivo } from "@/lib/dados";

const tempo = (ms: number) => `${Math.floor(ms / 60_000)}:${((ms % 60_000) / 1000).toFixed(1).padStart(4, "0").replace(".", ",")}`;

export function CapaQuadro({ video, valor, aoMudar, travado }: { video: Arquivo; valor?: number; aoMudar: (ms: number | undefined) => void; travado?: boolean }) {
  const [link, setLink] = useState<string>();
  const [falhou, setFalhou] = useState(false);
  const [duracao, setDuracao] = useState(0);
  const tela = useRef<HTMLVideoElement>(null);
  const src = video.url ?? link;
  useEffect(() => {
    if (video.url || !video.id) return;
    let vivo = true;
    linkDeVideo(video.id).then((u) => { if (vivo) setLink(u); }, () => { if (vivo) setFalhou(true); });
    return () => { vivo = false; };
  }, [video.url, video.id]);
  // O vídeo mostra o quadro escolhido (a barrinha só muda o número; quem pula o vídeo é isto).
  useEffect(() => { if (tela.current && duracao) tela.current.currentTime = (valor ?? 0) / 1000; }, [valor, duracao]);

  return (
    <div className="ficha-capa-quadro">
      {src ? <video ref={tela} src={src} muted playsInline preload="metadata" onLoadedMetadata={(e) => setDuracao(Math.floor(e.currentTarget.duration * 1000))} />
        : <span className="ficha-capa-vazio" aria-hidden />}
      <div className="ficha-capa-controles">
        <input type="range" min={0} max={duracao} step={100} value={valor ?? 0} disabled={!duracao || travado} aria-label="Quadro da capa" aria-valuetext={tempo(valor ?? 0)} onChange={(e) => aoMudar(Number(e.target.value))} />
        {/* miniatura estreita (Régua 215): o aviso de vídeo abrindo ou com falha fica aqui, na linha de texto */}
        {!src && <p className="ficha-capa-texto">{falhou ? "Não consegui abrir o vídeo." : "Abrindo o vídeo…"}</p>}
        <p className="ficha-capa-texto">
          {valor === undefined ? "Capa: primeiro quadro." : `Capa: quadro em ${tempo(valor)}.`}
          {valor !== undefined && !travado && <button type="button" className="ficha-texto-botao" onClick={() => aoMudar(undefined)}>Voltar ao primeiro quadro</button>}
        </p>
        <p className="ficha-capa-texto ficha-capa-fb">No Facebook sai o quadro que a Meta escolher.</p>
      </div>
    </div>
  );
}
