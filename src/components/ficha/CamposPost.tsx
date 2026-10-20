"use client";
// Campos de Postagem na ficha (196): Legenda (vai junto do post no Instagram e no Facebook) e, em Reels, a Capa do Reels.
// Capa: capa própria (anexo com papel "capa") vence; sem ela, o quadro escolhido na barrinha; sem nada, o primeiro quadro.
// `travado`: card Aprovado/Postado para quem não aprova (019); a ficha passa.
import type { Arquivo, NovaTarefa } from "@/lib/dados";
import { Anexos } from "./Anexos";
import { CapaQuadro } from "./CapaQuadro";

export function CamposPost({ t, arquivos, travado, mudar, aoMudarCapa }: {
  t: NovaTarefa; arquivos: Arquivo[]; travado: boolean; mudar: <K extends keyof NovaTarefa>(campo: K, valor: NovaTarefa[K]) => void; aoMudarCapa: (capas: Arquivo[]) => void;
}) {
  const capa = arquivos.find((a) => a.papel === "capa");
  const video = arquivos.find((a) => a.papel !== "capa" && a.tipo === "video");
  return (
    <>
      <label className="ficha-campo">
        <span className="ficha-legenda ficha-legenda-post">Legenda<small>{(t.legenda ?? "").length}/2200</small></span>
        <textarea rows={4} maxLength={2200} value={t.legenda ?? ""} readOnly={travado} onChange={(e) => mudar("legenda", e.target.value)}
          placeholder="O texto que vai junto do post no Instagram e no Facebook" />
      </label>
      {t.formato === "reels" && (
        <fieldset className="ficha-campo ficha-capa" disabled={travado}>
          <legend>Capa do Reels</legend>
          {/* Capa própria: 1 imagem 9:16 que eles fazem (Vitral sobe para o Drive); trocar substitui a antiga */}
          <Anexos valor={capa ? [capa] : []} aoMudar={aoMudarCapa} papel="capa" empresaId={t.empresaId} />
          {capa ? <p className="ficha-dica">Com capa própria, ela vence o quadro do vídeo. No Facebook sai o quadro que a Meta escolher.</p>
            : video ? <CapaQuadro key={video.id ?? video.url} video={video} valor={t.capaQuadroMs} travado={travado} aoMudar={(ms) => mudar("capaQuadroMs", ms)} />
            : <p className="ficha-dica">Anexe o vídeo para escolher o quadro da capa (sem escolha, vai o primeiro quadro).</p>}
        </fieldset>
      )}
    </>
  );
}
