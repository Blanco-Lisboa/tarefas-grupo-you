"use client";
// Peças da ficha para o Conserto (271) e o vídeo legendado (270). Saíram da Ficha.tsx para ela caber no limite de linhas.
import { useEu, type Arquivo, type NovaTarefa, type Tarefa } from "@/lib/dados";
import { podeAprovar } from "./Aprovacao";
import { linkDoDrive } from "./originais";

/** 271 · "Conserto": o que o aprovador pede para editar. Só aparece se o banco já tem a coluna (027: consertoTexto vem "" e não undefined),
    num card de Postagem que ainda não foi aprovado. Escreve quem aprova, em Análise ou Edição; os outros só leem. */
export function CampoConserto({ viva, t, mudar, soLer }: { viva?: Tarefa; t: NovaTarefa; mudar: <K extends keyof NovaTarefa>(campo: K, valor: NovaTarefa[K]) => void; soLer?: boolean }) {
  const eu = useEu();
  if (soLer || !viva || viva.tipo !== "postagem" || viva.consertoTexto === undefined || viva.etapa === "aprovado" || viva.etapa === "postado") return null;
  const escreve = (viva.etapa === "analise" || viva.etapa === "edicao") && podeAprovar(viva, eu);
  if (!escreve && !t.consertoTexto) return null;
  return (
    <label className="ficha-campo"><span className="ficha-legenda">Conserto</span>
      <textarea rows={3} maxLength={2000} value={t.consertoTexto ?? ""} readOnly={!escreve} onChange={(e) => mudar("consertoTexto", e.target.value)} placeholder="O que precisa ser editado neste vídeo?" />
    </label>
  );
}

/** 270 · Recado do vídeo legendado: no card Aprovado, quem pode mexer nos anexos sobe o legendado (ele vira o do post); o sem legenda fica guardado e aparece aqui. */
export function AvisosVideo({ arquivos, viva, travado }: { arquivos: Arquivo[]; viva?: Tarefa; travado: boolean }) {
  const originais = arquivos.filter((a) => a.papel === "original");
  return (
    <>
      {originais.length > 0 && <p className="ficha-dica">Sem legenda, guardado (não vai ao post): {originais.map((a, i) => <span key={a.id ?? a.nome}>{i > 0 && ", "}<a href={linkDoDrive(a)} target="_blank" rel="noopener noreferrer">{a.nome}</a></span>)}.</p>}
      {travado && <p className="ficha-dica ficha-dica-fica">Aprovado: descrição do post, formato, arquivos e capa só mudam por quem aprova (Natham, Adrian, Matheus ou o aprovador do card).</p>}
      {!travado && viva?.tipo === "postagem" && viva.etapa === "aprovado" && <p className="ficha-dica">Suba aqui o vídeo legendado: ele vira o vídeo do post e o anterior fica guardado.</p>}
    </>
  );
}
