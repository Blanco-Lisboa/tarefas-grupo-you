// FICHA DA TAREFA (modal na ID Nevoa). Usada pelo Calendário, Tarefas e Conteúdos. Como usar:
//
//   import { Ficha, tarefaEmBranco, NOMES } from "@/components/ficha/Ficha";
//   const [aberta, setAberta] = useState<NovaTarefa | null>(null);
//   <button onClick={() => setAberta(tarefa)}>…</button>                       // editar uma tarefa existente
//   <button onClick={() => setAberta(tarefaEmBranco({ etapa: "roteiro" }))}>…</button>  // criar (sem id = nova)
//   {aberta && <Ficha tarefa={aberta} aoFechar={() => setAberta(null)} />}
//
// - Renderize só quando houver tarefa (o estado interno nasce da tarefa recebida).
// - A ficha salva sozinha (salvarTarefa / removerTarefa) e chama aoFechar. Esc e clique fora fecham sem salvar.
// - soLer: só para olhar (Caderno de outra pessoa): campos travados, sem Salvar nem lixeira; links do Drive e das notas seguem abrindo.
//   Lixeira no pé (item 179) só para quem podeApagar: clicar troca o pé por Apagar (vermelho) e Cancelar; Esc também cancela.
// - Fazendo agora (item 170): tarefa já salva mostra Começar/Parar no topo e quem está nela desde quando (todos veem de todos).
// - Postagem em "Em análise" (item 208): Aprovar e Consertar no topo, ao lado de Começar/Fechar, para quem aprova. Gravam na hora
//   (como faziam no card) e a ficha continua aberta já no novo estado.
// - Sem campo Etapa (item 205): a etapa muda arrastando na Esteira; card novo com empresa entra em Roteiro (etapaAoSalvar).
// - tipos: limita o menu Tipo (a Esteira passa só os tipos que são colunas, item 194); sem ele, todos.
// - NOMES traz o texto de tela de cada valor: NOMES.tipo.gravacao = "Gravação", NOMES.rede.kwai = "Kwai", etc.
"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ehConteudo } from "@/components/tarefas/grade";
import {
  FORMATOS, REDES, RESPONSAVEIS, TIPOS, lerErro, limparErro, podeAlterar, podeApagar, removerTarefa, salvarTarefa, useEmpresas, useErroDados, useEu, useTags, useTarefas, useTarefasNoGoogle,
  type Etapa, type Formato, type Link as LinkDrive, type NovaTarefa, type Rede, type Responsavel, type Tarefa, type TipoTarefa,
} from "@/lib/dados";
import Link from "next/link";
import { deTexto, paraHora, vaiProGoogle } from "@/components/calendario/logica";
import { tomDaEmpresa } from "@/lib/cores-empresa";
import { Pessoa } from "@/components/ui/Pessoa";
import { Selecao } from "@/components/ui/Selecao";
import { IconeRede, SeloEmpresa } from "@/components/ui/Marca";
import { Agora } from "./Agora";
import { podeAprovar } from "./Aprovacao";
import { Anexos } from "./Anexos";
import { CamposPost } from "./CamposPost";
import { Publicacao } from "./Publicacao";
import { TagsFicha } from "./TagsFicha";
import { LINK_VALIDO, LinksDrive } from "./LinksDrive";
import { arrumar, ehQuemAprova, etapaAoSalvar, fimValido } from "./arrumar";
import { CampoOcasiao } from "./CampoOcasiao";
import { TextoComLinks } from "@/components/pastas/links";
import { CampoData } from "@/components/ui/CampoData";
import "./ficha.css";

export const NOMES = {
  tipo: { ideia: "Ideia", roteiro: "Roteiro", gravacao: "Gravação", edicao: "Edição", postagem: "Postagem", reuniao: "Reunião", outro: "Outro" },
  rede: { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", kwai: "Kwai" },
  formato: { reels: "Reels", post: "Post", carrossel: "Carrossel", story: "Story" },
  etapa: { roteiro: "Roteiro", gravacao: "Gravação", edicao: "Edição", analise: "Em análise", aprovado: "Aprovado", postado: "Postado" },
  responsavel: { natham: "Natham", matheus: "Matheus", adrian: "Adrian", lucas: "Lucas" },
} as const satisfies {
  tipo: Record<TipoTarefa, string>; formato: Record<Formato, string>; rede: Record<Rede, string>; etapa: Record<Etapa, string>; responsavel: Record<Responsavel, string>;
};

/** Tarefa nova com valores padrão. empresaId vazio: com etapa (o + de uma coluna da Esteira), a ficha escolhe a primeira empresa
    cadastrada; sem etapa (Calendário), fica sem empresa e só vira card se a pessoa escolher uma (item 217). */
export const tarefaEmBranco = (parcial: Partial<NovaTarefa> = {}): NovaTarefa => ({
  titulo: "", tipo: "outro", empresaId: "", responsavel: "natham", diaInteiro: false,
  cor: "etiqueta-1", links: [], arquivos: [], ...parcial,
});

const NENHUMA = "nenhuma"; // valor do seletor Empresa; a tarefa sem empresa guarda empresaId ""
const HORA = 60 * 60_000;

export function Ficha({ tarefa, aoFechar, soLer, tipos = TIPOS }: { tarefa: NovaTarefa; aoFechar: () => void; soLer?: boolean; tipos?: readonly TipoTarefa[] }) {
  const empresas = useEmpresas();
  const tags = useTags();
  const todas = useTarefas();
  const eu = useEu();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [t, setT] = useState<NovaTarefa>(() => ({ ...tarefa, empresaId: tarefa.id || !tarefa.etapa ? tarefa.empresaId : tarefa.empresaId || empresas[0]?.id || "" })); // tarefa já existente sem empresa continua sem empresa (item 125)
  const [data, setData] = useState(tarefa.inicio?.slice(0, 10) ?? "");
  const [horaIni, setHoraIni] = useState(tarefa.inicio?.slice(11, 16) || "09:00");
  // Sem campo Termina (item 159): tarefa nova nasce sem fim; a antiga guarda o fim que tinha e ele anda junto com o Começa.
  const [horaFim, setHoraFim] = useState(tarefa.id ? tarefa.fim?.slice(11, 16) ?? "" : "");
  const [dataFim, setDataFim] = useState(tarefa.id ? tarefa.fim?.slice(0, 10) ?? "" : "");
  const [links, setLinks] = useState<LinkDrive[]>(tarefa.links);
  const [arquivos, setArquivos] = useState(tarefa.arquivos);
  const [editandoNotas, setEditandoNotas] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [recusa, setRecusa] = useState(""); // Aprovar/Consertar que o banco recusou
  // Só fecha depois que o banco aceitou: se recusar, a ficha fica aberta com o aviso e nada do que foi escrito se perde.
  // (O aviso geral da casca fica atrás da ficha, então o erro aparece também no pé dela.)
  const erro = useErroDados();
  const [salvando, setSalvando] = useState(false);
  const [enviou, setEnviou] = useState(false);
  useEffect(() => { if (enviou && !erro) aoFechar(); }, [enviou, erro, aoFechar]);
  const nova = !tarefa.id;
  // Selo do Google (item 192, Lupa R5-5): "Na agenda" só depois que o n8n confirmou; antes, "Indo" se a regra do banco deixa ir.
  const noGoogle = useTarefasNoGoogle().has(tarefa.id ?? "");
  const vai = vaiProGoogle(t, !!data, nova ? eu : tarefa.criadoPor);
  const dono = tarefa.dono ?? tarefa.responsavel;
  const fica = !nova && !soLer && !ehConteudo(t) && t.responsavel !== dono ? dono : undefined; // o banco não deixa mudar o dono
  const lixeira = !nova && podeApagar({ ...tarefa, id: tarefa.id! }, eu); // vale o que está no banco, não o que foi mudado na ficha
  const marcadas = t.tags ?? [];
  const pedeAprovador = tags.some((g) => g.aprovacao && marcadas.includes(g.id));
  const aprovadorTravado = !nova && !ehQuemAprova(tarefa.aprovador, eu);
  // 019: depois de Aprovado, o que vai para a rede (descrição do post, formato, arquivos, capa) só muda pelo Natham ou por quem aprova.
  const postTravado = !nova && (tarefa.etapa === "aprovado" || tarefa.etapa === "postado") && !(podeAlterar(tarefa as Tarefa, eu) && ehQuemAprova(tarefa.aprovador, eu));
  const capas = arquivos.filter((a) => a.papel === "capa");
  const viva = todas.find((x) => x.id === tarefa.id); // a ficha nasce de uma cópia; a Publicação lê o card vivo (postando, erro, links)
  const temEmpresa = empresas.some((x) => x.id === t.empresaId);
  const empresaOk = !t.empresaId || temEmpresa; // "" = sem empresa
  const mudar = <K extends keyof NovaTarefa>(campo: K, valor: NovaTarefa[K]) => setT((x) => ({ ...x, [campo]: valor }));
  const decide = !soLer && viva?.tipo === "postagem" && viva.etapa === "analise" && podeAprovar(viva, eu);
  // Grava só a etapa no card salvo (o mesmo que o card fazia); a ficha passa a mostrar a nova etapa, e um Salvar depois não a desfaz.
  async function decidir(mudanca: Pick<NovaTarefa, "etapa" | "conserto">) {
    if (!viva) return;
    limparErro();
    setRecusa("");
    await salvarTarefa({ ...viva, ...mudanca });
    const e = lerErro();
    if (e) setRecusa(e);
    else setT((x) => ({ ...x, ...mudanca }));
  }

  // Mudou o início: o fim anda junto e a duração fica igual (senão o fim fica antes do início e trava o formulário).
  // A última duração válida fica guardada para o caminho "limpa a data e escolhe outra" (sem data não dá para medir).
  const duracao = useRef(HORA);
  function mudarInicio(novaData: string, novaHora: string) {
    if (data && horaFim) {
      const atual = deTexto(`${dataFim || data}T${horaFim}`).getTime() - deTexto(`${data}T${horaIni}`).getTime();
      if (atual > 0) duracao.current = atual;
    }
    if (novaData && horaFim) {
      const fim = paraHora(new Date(deTexto(`${novaData}T${novaHora}`).getTime() + duracao.current));
      setDataFim(fim.slice(0, 10));
      setHoraFim(fim.slice(11, 16));
    }
    setData(novaData);
    setHoraIni(novaHora);
  }

  useEffect(() => {
    const d = dialogo.current;
    if (d && !d.open) d.showModal();
  }, []);

  /** Salva a ficha inteira (`extra` por cima: a Publicação manda redes e data); true = o banco aceitou. */
  async function gravar(extra: Partial<NovaTarefa> = {}): Promise<boolean> {
    if (soLer || !t.titulo.trim() || !empresaOk || salvando) return false; // salvando: dois cliques em Salvar criavam a tarefa duas vezes
    const quando: Pick<NovaTarefa, "inicio" | "fim" | "diaInteiro"> = !data
      ? { inicio: undefined, fim: undefined, diaInteiro: false }
      : t.diaInteiro
        ? { inicio: data, fim: undefined, diaInteiro: true }
        : { inicio: `${data}T${horaIni}`, fim: fimValido(data, horaIni, dataFim || data, horaFim), diaInteiro: false };
    limparErro();
    setEnviou(false);
    setSalvando(true);
    // Tarefa nova para outra pessoa vai para o caderno dela (achado 2, igual ao Caderno). Conteúdo com empresa todos já veem: fica de quem criou.
    const etapa = etapaAoSalvar(t);
    const enviarPara = nova && t.responsavel !== eu && !ehConteudo({ ...t, etapa }) ? t.responsavel : undefined;
    const pronta = arrumar(t, pedeAprovador, {
      ...quando, etapa, enviarPara, arquivos,
      vaiProGoogle: nova ? vai : tarefa.vaiProGoogle, // só liga na criação e se pode ir (R5-5)
      links: links.filter((l) => LINK_VALIDO.test(l.url.trim())).map((l) => ({ rotulo: l.rotulo.trim() || "Link do Drive", url: l.url.trim() })),
    });
    await salvarTarefa({ ...(aprovadorTravado ? { ...pronta, aprovador: tarefa.aprovador } : pronta), ...extra }); // só quem aprova muda o aprovador (015), mesmo tirando a tag
    setSalvando(false);
    setEnviou(true);
    return !lerErro();
  }

  async function excluir() {
    if (!tarefa.id) return;
    limparErro();
    await removerTarefa(tarefa.id);
    setEnviou(true);
  }

  const dona = empresas.find((e) => e.id === t.empresaId);
  const corAtual = { "--etiqueta-atual": dona ? tomDaEmpresa(dona.id).r : t.etapa ? `var(--etapa-${t.etapa})` : "var(--borda)" } as CSSProperties;

  return (
    <dialog
      ref={dialogo}
      className="ficha"
      aria-label={nova ? "Nova tarefa" : `Tarefa ${tarefa.titulo}`}
      onClose={aoFechar} onCancel={(e) => { if (apagando) { e.preventDefault(); setApagando(false); } }}
      onClick={(e) => e.target === e.currentTarget && dialogo.current?.close()}
    >
      <form className="ficha-cartao" onSubmit={(e) => { e.preventDefault(); void gravar(); }} style={corAtual}>
        <header className="ficha-faixa">
          <div className="ficha-faixa-topo">
            <span className="ficha-rotulo"><span className="ficha-cor-marca" aria-hidden />{nova ? "Nova tarefa" : NOMES.tipo[t.tipo]}
              {(noGoogle || vai) && (
                <span className={`ficha-google${noGoogle ? "" : " ficha-google-indo"}`}>
                  <svg viewBox="0 0 24 24" aria-hidden><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
                  {noGoogle ? "Na agenda do Google" : "Indo para o Google"}
                </span>
              )}
            </span>
            {!nova && <Agora tarefaId={tarefa.id!} soLer={soLer} nomes={NOMES.responsavel} />}
            {decide && (
              <div className="ficha-decidir">
                <button type="button" className="aprovacao-botao" data-acao="aprovar" onClick={() => void decidir({ etapa: "aprovado" })}>Aprovar</button>
                <button type="button" className="aprovacao-botao" data-acao="consertar" onClick={() => void decidir({ etapa: "edicao", conserto: true })}>Consertar</button>
              </div>
            )}
            <button type="button" className="ficha-fechar" onClick={() => dialogo.current?.close()}>Fechar</button>
          </div>
          <textarea
            className="ficha-titulo"
            rows={1}
            value={t.titulo}
            onChange={(e) => mudar("titulo", e.target.value.replace(/[\r\n]+/g, " "))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Título da tarefa"
            aria-label="Título"
            required
            readOnly={soLer}
            autoFocus={!soLer}
          />
        </header>

        <fieldset className="ficha-corpo" disabled={soLer}>
          <div className="ficha-grade">
            <div className="ficha-campo ficha-escolha">
              <Selecao rotulo="Tipo" opcoes={tipos.map((v) => ({ valor: v, rotulo: NOMES.tipo[v] }))} valor={[t.tipo]} multipla={false} aoMudar={([v]) => { if (v) mudar("tipo", v as TipoTarefa); }} />
            </div>
            <div className="ficha-campo ficha-escolha">
              {empresas.length ? (
                <Selecao rotulo="Empresa" soIcone opcoes={[...empresas.map((x) => ({ valor: x.id, rotulo: x.nome, antes: <SeloEmpresa empresaId={x.id} nome={x.nome} tamanho={18} /> })), { valor: NENHUMA, rotulo: "Nenhuma" }]} valor={t.empresaId ? (temEmpresa ? [t.empresaId] : []) : [NENHUMA]} multipla={false} aoMudar={([v]) => { if (v) mudar("empresaId", v === NENHUMA ? "" : v); }} />
              ) : (
                <p className="ficha-aviso" role="alert">
                  Nenhuma empresa cadastrada. <Link href="/configuracoes" onClick={() => dialogo.current?.close()}>Cadastrar em Configurações</Link>
                </p>
              )}
            </div>
            <div className="ficha-campo ficha-escolha">
              <Selecao rotulo="Rede" soIcone opcoes={REDES.map((v) => ({ valor: v, rotulo: NOMES.rede[v], antes: <IconeRede rede={v} tamanho={18} /> }))} valor={t.rede ? [t.rede] : []} multipla={false} rotuloTodos="Sem rede" aoMudar={([v]) => mudar("rede", v as Rede | undefined)} />
            </div>
            {t.tipo === "postagem" && (
              // Formato já ao criar/anexar (203): é dele que sai o campo Capa do Reels. O Programar postagem do card usa o mesmo valor.
              <div className="ficha-campo ficha-escolha" inert={postTravado}>
                <Selecao rotulo="Formato" opcoes={FORMATOS.map((v) => ({ valor: v, rotulo: NOMES.formato[v] }))} valor={t.formato ? [t.formato] : []} multipla={false} rotuloTodos="Sem formato" aoMudar={([v]) => mudar("formato", v as Formato | undefined)} />
              </div>
            )}
            {/* Ocasião = pasta do Drive dentro da empresa (203, Vitral); sem empresa não existe */}
            {t.empresaId && <div className="ficha-campo ficha-escolha"><CampoOcasiao tarefaId={tarefa.id} empresaId={t.empresaId} valor={t.ocasiaoId} aoMudar={(id) => mudar("ocasiaoId", id)} /></div>}
          </div>

          <div className="ficha-quem-quando">
            <fieldset className="ficha-campo">
              <legend>Responsável</legend>
              <div className="ficha-pessoas">
                {RESPONSAVEIS.map((r) => (
                  <button key={r} type="button" className="ficha-pessoa" aria-pressed={t.responsavel === r} onClick={() => mudar("responsavel", r)}>
                    <Pessoa quem={r} tamanho={28} />
                    {NOMES.responsavel[r]}
                  </button>
                ))}
              </div>
              {fica && <p className="ficha-dica ficha-dica-fica">Continua no caderno de {NOMES.responsavel[fica]}: trocar o responsável não entrega a tarefa a outra pessoa.</p>}
            </fieldset>

            <fieldset className="ficha-campo" aria-label="Quando">
              <div className="ficha-quando">
                {/* Data e hora no mesmo painel (item 76): calendário + rodas de hora e minuto. Conteúdo antigo de dia inteiro mostra só a data. */}
                <div className="ficha-mini">
                  {t.diaInteiro ? "Data" : "Começa"}
                  <CampoData rotulo={t.diaInteiro ? "Data" : "Começa"} valor={data} hora={t.diaInteiro ? undefined : data ? horaIni : ""}
                    aoMudar={(d, h) => mudarInicio(d, h || horaIni)} />
                </div>
              </div>
              {!data && <p className="ficha-dica">Sem data: fica na coluna &quot;Sem data&quot; do calendário.</p>}
            </fieldset>
          </div>

          {t.tipo === "postagem" && (
            <Campo rotulo="Objetivo">
              <input value={t.objetivo ?? ""} onChange={(e) => mudar("objetivo", e.target.value)} placeholder="Para que serve este conteúdo?" />
            </Campo>
          )}
          {t.tipo === "postagem" && <CamposPost t={t} arquivos={arquivos} travado={postTravado} mudar={mudar} aoMudarCapa={(v) => setArquivos([...arquivos.filter((a) => a.papel !== "capa"), ...v])} />}
          {viva && <Publicacao salvo={viva} rascunho={{ ...t, arquivos }} mudar={mudar} gravar={gravar} />}

          <div className="ficha-opcional" aria-hidden>Opcional</div>
          <TagsFicha t={t} mudar={mudar} pedeAprovador={pedeAprovador} aprovadorTravado={aprovadorTravado} />

          <LinksDrive links={links} aoMudar={setLinks} />
          <div inert={postTravado}><Anexos valor={arquivos.filter((a) => a.papel !== "capa")} aoMudar={(v) => setArquivos([...v, ...capas])} empresaId={t.empresaId} carrossel={t.formato === "carrossel"} /></div>
          {postTravado && <p className="ficha-dica ficha-dica-fica">Aprovado: descrição do post, formato, arquivos e capa só mudam pelo Natham ou por quem aprova.</p>}

          <div className="ficha-campo ficha-notas">
            <label className="ficha-legenda" htmlFor="ficha-notas">Notas</label>
            {/* Link escrito nas notas aparece como "Ver referência" (mesmo componente das Ideias das Pastas); ao clicar no texto volta o texto cru para editar. */}
            {!editandoNotas && /https?:\/\//.test(t.notas ?? "") ? (
              <div className="ficha-notas-ver" tabIndex={0} role="textbox" aria-label="Notas (clique para editar)"
                onClick={(e) => { if (!soLer && !(e.target as HTMLElement).closest("a")) setEditandoNotas(true); }}
                onKeyDown={(e) => { if (!soLer && e.key === "Enter" && e.target === e.currentTarget) { e.preventDefault(); setEditandoNotas(true); } }}>
                <TextoComLinks texto={t.notas ?? ""} />
              </div>
            ) : (
              <textarea id="ficha-notas" rows={10} value={t.notas ?? ""} autoFocus={editandoNotas} onChange={(e) => mudar("notas", e.target.value)} onBlur={() => setEditandoNotas(false)} placeholder="Ideias, roteiro, combinados..." />
            )}
          </div>

        </fieldset>

        <footer className="ficha-pe">
          {soLer && <p className="ficha-so-ler">Só para olhar: tarefa de outra pessoa.</p>}
          {apagando ? (
            <div className="ficha-apagando"><button type="button" className="btn ficha-apagar" onClick={() => void excluir()}>Apagar</button><button type="button" className="btn btn-2" autoFocus onClick={() => setApagando(false)}>Cancelar</button></div>
          ) : lixeira && (
            <button type="button" className="ficha-lixeira" aria-label="Apagar tarefa" title="Apagar tarefa" onClick={() => setApagando(true)}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6M8.5 9v4M11.5 9v4" /></svg></button>
          )}
          {((enviou && erro) || recusa) && <p className="ficha-erro" role="alert">{recusa || erro}</p>}
          {!apagando && <button type="button" className="btn btn-2" onClick={() => dialogo.current?.close()}>{soLer ? "Fechar" : "Cancelar"}</button>}
          {!soLer && !apagando && <button type="submit" className="btn" disabled={!t.titulo.trim() || !empresaOk || salvando}>{salvando ? "Salvando..." : "Salvar"}</button>}
        </footer>
      </form>
    </dialog>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return <label className="ficha-campo"><span className="ficha-legenda">{rotulo}</span>{children}</label>;
}

