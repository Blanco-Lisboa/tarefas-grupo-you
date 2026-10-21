"use client";
// Aprovação e postagem no card da Esteira (itens 195, 200, 196). Como usar:
//
//   <SeloConserto tarefa={tarefa} />   // etiqueta vermelha "Conserto" com a chave inglesa (só aparece com tarefa.conserto)
//   <Aprovacao tarefa={tarefa} />      // o pé do card, conforme o tipo e a etapa (abaixo)
//
// - Card que NÃO é Postagem: "Concluir" em qualquer etapa (Natham, Matheus ou o dono), que pede confirmação e APAGA o card (decisão de 23/10).
// - Postagem em "Em análise": Aprovar (vai para Aprovado) e Consertar (volta para Edição com a etiqueta).
// - Postagem em "Aprovado": a situação (Programado, Postando…, faixa vermelha) para todos; para o Natham e quem aprova,
//   Programar postagem (formato, Instagram/Facebook, data e hora, com a checagem do que falta) e Postar agora (com confirmação).
//   Só a You está ligada: em card de outra empresa os botões dão lugar ao aviso.
// - Postagem em "Postado": links "Ver no Instagram" / "Ver no Facebook".
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FORMATOS, REDES_POST, podeAlterar, podeApagar, postarAgora, removerTarefa, salvarTarefa, tentarDeNovo, useEu, type Formato, type RedePost, type Responsavel, type Tarefa } from "@/lib/dados";
import { paraDia, paraHora } from "@/components/calendario/logica";
import { CampoData } from "@/components/ui/CampoData";
import { NOMES } from "./Ficha";
import { ehQuemAprova } from "./arrumar";
import { Confirmar } from "./Confirmar";
import { NOME_REDE, carrosselComVideo, faltaParaPostar, redesDe, redesValidas, situacao, textoRedes } from "./postagem";
import "./aprovacao.css";

export const podeAprovar = (t: Tarefa, eu: Responsavel | null) => podeAlterar(t, eu) && ehQuemAprova(t.aprovador, eu);

const CHAVE = "M14.7 6.3a4 4 0 00-5.4 5.2L4 16.8 7.2 20l5.3-5.3a4 4 0 005.2-5.4l-2.4 2.4-2.6-.6-.6-2.6z";
export function SeloConserto({ tarefa }: { tarefa: Tarefa }) {
  return tarefa.conserto ? <span className="selo-conserto" role="status"><svg viewBox="0 0 24 24" aria-hidden><path d={CHAVE} /></svg>Conserto</span> : null;
}

export function Aprovacao({ tarefa }: { tarefa: Tarefa }) {
  const eu = useEu();
  const [escolhendo, setEscolhendo] = useState(false);
  const [formato, setFormato] = useState<Formato | undefined>(tarefa.formato);
  const [redes, setRedes] = useState<RedePost[]>(redesDe(tarefa));
  const [falta, setFalta] = useState<string[]>([]);
  const [confirmando, setConfirmando] = useState<"concluir" | "postar" | null>(null);
  const quando = useRef<HTMLDivElement>(null);
  // Com o formato escolhido, o painel de data e hora já abre, sem mais um clique.
  useEffect(() => { if (escolhendo && formato) quando.current?.querySelector<HTMLButtonElement>(".campo-data-botao")?.click(); }, [escolhendo, formato]);

  // Sem isto, arrastar as rodas da hora (ou clicar nos botões) "pegava" o card para arrastar.
  const pe = (filhos: ReactNode, classe = "") => <div className={`aprovacao ${classe}`} onPointerDown={(e) => e.stopPropagation()}>{filhos}</div>;

  if (tarefa.tipo !== "postagem") {
    if (!podeApagar(tarefa, eu)) return null;
    return pe(<>
      <button type="button" className="aprovacao-botao" data-acao="concluir" onClick={() => setConfirmando("concluir")}>Concluir</button>
      {confirmando && <Confirmar titulo="Concluir e apagar este card?" texto={`"${tarefa.titulo}" sai do sistema, com os anexos. Não dá para desfazer.`} acao="Concluir" perigo
        aoCancelar={() => setConfirmando(null)} aoConfirmar={() => { setConfirmando(null); void removerTarefa(tarefa.id); }} />}
    </>);
  }

  if (tarefa.etapa === "postado") {
    const links = (tarefa.postagens ?? []).filter((p) => p.link);
    return links.length ? pe(links.map((p) => <a key={p.rede} className="aprovacao-link" href={p.link} target="_blank" rel="noopener noreferrer">Ver no {NOME_REDE[p.rede]}</a>), "aprovacao-links") : null;
  }

  const aprova = podeAprovar(tarefa, eu);
  if (tarefa.etapa === "analise") {
    return aprova ? pe(<>
      <button type="button" className="aprovacao-botao" data-acao="aprovar" onClick={() => void salvarTarefa({ ...tarefa, etapa: "aprovado" })}>Aprovar</button>
      <button type="button" className="aprovacao-botao" data-acao="consertar" onClick={() => void salvarTarefa({ ...tarefa, etapa: "edicao", conserto: true })}>Consertar</button>
    </>) : null;
  }
  if (tarefa.etapa !== "aprovado") return null;

  const sit = situacao(tarefa);
  if (!aprova && !sit) return null;
  const ligada = tarefa.empresaId === "you";
  const soInstagram = carrosselComVideo(tarefa, formato);
  const agora = redesValidas(tarefa, tarefa.formato, redesDe(tarefa));

  function programar(dia: string, hora: string) {
    const quando = `${dia}T${hora || "00:00"}`;
    const r = redesValidas(tarefa, formato, redes);
    const f = [...faltaParaPostar(tarefa, formato, r), ...(quando < paraHora(new Date()) ? ["Escolha um horário que ainda não passou."] : [])];
    setFalta(f);
    if (f.length) return;
    setEscolhendo(false);
    void salvarTarefa({ ...tarefa, formato, postarRedes: r, postarEm: quando });
  }
  function pedirPostarAgora() {
    const f = faltaParaPostar(tarefa, tarefa.formato, agora);
    setFalta(f);
    if (!f.length) setConfirmando("postar");
  }

  return pe(<>
    {sit?.tipo === "postando" && <p className="aprovacao-situacao" data-tipo="postando" role="status">Postando…</p>}
    {sit?.tipo === "programado" && <p className="aprovacao-situacao">{sit.texto}</p>}
    {/* O salvar troca as redes para só Instagram (redesQueValem, achado 6 da Lupa); aqui o aviso de que o Facebook ficou de fora */}
    {sit?.tipo === "programado" && carrosselComVideo(tarefa, tarefa.formato) && <p className="aprovacao-nota">Carrossel com vídeo vai só para o Instagram: o Facebook não aceita foto e vídeo no mesmo post.</p>}
    {sit?.tipo === "erro" && (
      <div className="aprovacao-erro" role="alert">
        <p>{sit.texto}</p>
        {sit.incerto && <p className="aprovacao-incerto">Pode ter saído. Olhe o perfil da You no {sit.refazer.map((r) => NOME_REDE[r]).join(" e ")} antes de tentar de novo, senão o post pode sair duas vezes.</p>}
        {sit.saiu?.link && <a className="aprovacao-link" href={sit.saiu.link} target="_blank" rel="noopener noreferrer">Ver no {NOME_REDE[sit.saiu.rede]}</a>}
        {aprova && <button type="button" className="aprovacao-botao" data-acao="tentar" onClick={() => void tentarDeNovo(tarefa.id)}>
          {sit.incerto ? "Já olhei o perfil: tentar de novo" : sit.saiu && sit.refazer.length === 1 ? `Tentar de novo só no ${NOME_REDE[sit.refazer[0]]}` : "Tentar de novo"}
        </button>}
      </div>
    )}
    {/* Com erro, o caminho é só "Tentar de novo" (019: postar_agora não mexe em rede que deu erro, e reprogramar não a tira do erro) */}
    {aprova && sit?.tipo !== "postando" && sit?.tipo !== "erro" && (!ligada ? (
      <p className="aprovacao-aviso">{faltaParaPostar(tarefa, formato, redes)[0]}</p>
    ) : escolhendo ? (
      <div className="aprovacao-quando" ref={quando}>
        <div className="aprovacao-formatos" role="radiogroup" aria-label="Formato do post">
          {FORMATOS.map((f) => (
            <button key={f} type="button" role="radio" aria-checked={formato === f} className="aprovacao-formato" onClick={() => setFormato(f)}>{NOMES.formato[f]}</button>
          ))}
        </div>
        <div className="aprovacao-redes" role="group" aria-label="Onde postar">
          {REDES_POST.map((r) => {
            const fora = r === "facebook" && soInstagram;
            return <button key={r} type="button" className="aprovacao-rede" aria-pressed={!fora && redes.includes(r)} disabled={fora}
              onClick={() => setRedes(redes.includes(r) ? redes.filter((x) => x !== r) : REDES_POST.filter((x) => x === r || redes.includes(x)))}>{NOME_REDE[r]}</button>;
          })}
          {soInstagram && <small className="aprovacao-nota">Carrossel com vídeo só vai para o Instagram.</small>}
        </div>
        {formato && <CampoData rotulo="Data e hora do post" valor={tarefa.postarEm?.slice(0, 10) ?? ""} hora={tarefa.postarEm?.slice(11, 16) ?? ""} min={paraDia(new Date())} semLimpar vazio="Quando?"
          aoMudar={(dia, hora) => { if (dia) programar(dia, hora ?? ""); }} />}
        <button type="button" className="aprovacao-cancelar" onClick={() => { setEscolhendo(false); setFalta([]); }}>Cancelar</button>
      </div>
    ) : (
      <>
        <button type="button" className="aprovacao-botao" data-acao={tarefa.postarEm ? "reprogramar" : "aprovar"} onClick={() => { setFalta([]); setEscolhendo(true); }}>
          {tarefa.postarEm ? "Reprogramar postagem" : "Programar postagem"}
        </button>
        {tarefa.formato && <button type="button" className="aprovacao-botao" data-acao="postar" onClick={pedirPostarAgora}>Postar agora</button>}
      </>
    ))}
    {falta.length > 0 && <ul className="aprovacao-falta" role="alert">{falta.map((f) => <li key={f}>{f}</li>)}</ul>}
    {confirmando === "postar" && <Confirmar titulo={`Postar agora no ${textoRedes(agora)} da You?`} texto={`"${tarefa.titulo}" vai para o ar agora. Não dá para desfazer.`} acao="Postar"
      aoCancelar={() => setConfirmando(null)} aoConfirmar={async () => { setConfirmando(null); if (agora.length !== redesDe(tarefa).length) await salvarTarefa({ ...tarefa, postarRedes: agora }); void postarAgora(tarefa.id); }} />}
  </>, "aprovacao-postagem");
}
