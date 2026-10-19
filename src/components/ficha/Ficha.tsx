// FICHA DA TAREFA (modal na ID Nevoa). Usada pelo Calendário, Tarefas e Conteúdos. Como usar:
//
//   import { Ficha, tarefaEmBranco, NOMES } from "@/components/ficha/Ficha";
//   const [aberta, setAberta] = useState<NovaTarefa | null>(null);
//   <button onClick={() => setAberta(tarefa)}>…</button>                       // editar uma tarefa existente
//   <button onClick={() => setAberta(tarefaEmBranco({ etapa: "ideia" }))}>…</button>  // criar (sem id = nova)
//   {aberta && <Ficha tarefa={aberta} aoFechar={() => setAberta(null)} />}
//
// - Renderize só quando houver tarefa (o estado interno nasce da tarefa recebida).
// - A ficha salva sozinha (salvarTarefa / removerTarefa) e chama aoFechar. Esc e clique fora fecham sem salvar.
// - NOMES traz o texto de tela de cada valor: NOMES.tipo.gravacao = "Gravação", NOMES.rede.kwai = "Kwai", etc.
"use client";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  ETAPAS, ETIQUETAS, REDES, RESPONSAVEIS, TIPOS, removerTarefa, salvarTarefa, useEmpresas,
  type Etapa, type Link as LinkDrive, type NovaTarefa, type Rede, type Responsavel, type TipoTarefa,
} from "@/lib/dados";
import Link from "next/link";
import { deTexto, paraHora } from "@/components/calendario/logica";
import { Selecao } from "@/components/ui/Selecao";
import { IconeRede, SeloEmpresa } from "@/components/ui/Marca";
import { CampoData } from "@/components/ui/CampoData";
import "./ficha.css";

export const NOMES = {
  tipo: { ideia: "Ideia", roteiro: "Roteiro", gravacao: "Gravação", edicao: "Edição", postagem: "Postagem", reuniao: "Reunião", outro: "Outro" },
  rede: { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", kwai: "Kwai" },
  etapa: { ideia: "Ideia", roteiro: "Roteiro", gravacao: "Gravação", edicao: "Edição", aprovado: "Aprovado", postado: "Postado" },
  responsavel: { natham: "Natham", matheus: "Matheus" },
} as const satisfies {
  tipo: Record<TipoTarefa, string>; rede: Record<Rede, string>; etapa: Record<Etapa, string>; responsavel: Record<Responsavel, string>;
};

/** Tarefa nova com valores padrão. empresaId vazio = a ficha escolhe a primeira empresa cadastrada. */
export const tarefaEmBranco = (parcial: Partial<NovaTarefa> = {}): NovaTarefa => ({
  titulo: "", tipo: "outro", empresaId: "", responsavel: "natham", diaInteiro: false,
  cor: "etiqueta-1", links: [], arquivos: [], ...parcial,
});

const LINK_VALIDO = /^https?:\/\//i;
const HORA = 60 * 60_000;

export function Ficha({ tarefa, aoFechar }: { tarefa: NovaTarefa; aoFechar: () => void }) {
  const empresas = useEmpresas();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [t, setT] = useState<NovaTarefa>(() => ({ ...tarefa, empresaId: tarefa.empresaId || empresas[0]?.id || "" }));
  const [data, setData] = useState(tarefa.inicio?.slice(0, 10) ?? "");
  const [horaIni, setHoraIni] = useState(tarefa.inicio?.slice(11, 16) || "09:00");
  const [horaFim, setHoraFim] = useState(tarefa.fim?.slice(11, 16) ?? "");
  const [dataFim, setDataFim] = useState(tarefa.fim?.slice(0, 10) ?? "");
  const [links, setLinks] = useState<LinkDrive[]>(tarefa.links);
  const nova = !tarefa.id;
  const temEmpresa = empresas.some((x) => x.id === t.empresaId);
  const mudar = <K extends keyof NovaTarefa>(campo: K, valor: NovaTarefa[K]) => setT((x) => ({ ...x, [campo]: valor }));

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

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!t.titulo.trim() || !temEmpresa) return;
    const quando: Pick<NovaTarefa, "inicio" | "fim" | "diaInteiro"> = !data
      ? { inicio: undefined, fim: undefined, diaInteiro: false }
      : t.diaInteiro
        ? { inicio: data, fim: undefined, diaInteiro: true }
        : { inicio: `${data}T${horaIni}`, fim: fimValido(data, horaIni, dataFim || data, horaFim), diaInteiro: false };
    await salvarTarefa({
      ...t, ...quando, titulo: t.titulo.trim(), objetivo: t.tipo === "postagem" ? t.objetivo?.trim() || undefined : undefined, notas: t.notas?.trim() || undefined,
      links: links.filter((l) => LINK_VALIDO.test(l.url.trim())).map((l) => ({ rotulo: l.rotulo.trim() || "Link do Drive", url: l.url.trim() })),
    });
    aoFechar();
  }

  async function excluir() {
    if (!tarefa.id || !window.confirm(`Excluir a tarefa "${tarefa.titulo}"? Não dá para desfazer.`)) return;
    await removerTarefa(tarefa.id);
    aoFechar();
  }

  const corAtual = { "--etiqueta-atual": `var(--${t.cor})` } as CSSProperties;

  return (
    <dialog
      ref={dialogo}
      className="ficha"
      aria-label={nova ? "Nova tarefa" : `Tarefa ${tarefa.titulo}`}
      onClose={aoFechar}
      onClick={(e) => e.target === e.currentTarget && dialogo.current?.close()}
    >
      <form className="ficha-cartao" onSubmit={salvar} style={corAtual}>
        <header className="ficha-faixa">
          <div className="ficha-faixa-topo">
            <span className="ficha-rotulo"><span className="ficha-cor-marca" aria-hidden />{nova ? "Nova tarefa" : NOMES.tipo[t.tipo]}</span>
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
            autoFocus
          />
        </header>

        <div className="ficha-corpo">
          <div className="ficha-grade">
            <div className="ficha-campo ficha-escolha">
              <Selecao rotulo="Tipo" opcoes={TIPOS.map((v) => ({ valor: v, rotulo: NOMES.tipo[v] }))} valor={[t.tipo]} multipla={false} aoMudar={([v]) => { if (v) mudar("tipo", v as TipoTarefa); }} />
            </div>
            <div className="ficha-campo ficha-escolha">
              {empresas.length ? (
                <Selecao rotulo="Empresa" opcoes={empresas.map((x) => ({ valor: x.id, rotulo: x.nome, antes: <SeloEmpresa empresaId={x.id} nome={x.nome} tamanho={18} /> }))} valor={temEmpresa ? [t.empresaId] : []} multipla={false} aoMudar={([v]) => { if (v) mudar("empresaId", v); }} />
              ) : (
                <p className="ficha-aviso" role="alert">
                  Nenhuma empresa cadastrada. <Link href="/configuracoes" onClick={() => dialogo.current?.close()}>Cadastrar em Configurações</Link>
                </p>
              )}
            </div>
            <div className="ficha-campo ficha-escolha">
              <Selecao rotulo="Rede" opcoes={REDES.map((v) => ({ valor: v, rotulo: NOMES.rede[v], antes: <IconeRede rede={v} tamanho={18} /> }))} valor={t.rede ? [t.rede] : []} multipla={false} rotuloTodos="Sem rede" aoMudar={([v]) => mudar("rede", v as Rede | undefined)} />
            </div>
            <div className="ficha-campo ficha-escolha">
              <Selecao rotulo="Etapa" opcoes={ETAPAS.map((v) => ({ valor: v, rotulo: NOMES.etapa[v] }))} valor={t.etapa ? [t.etapa] : []} multipla={false} rotuloTodos="Sem etapa" aoMudar={([v]) => mudar("etapa", v as Etapa | undefined)} />
            </div>
          </div>

          <fieldset className="ficha-campo">
            <legend>Responsável</legend>
            <div className="ficha-pessoas">
              {RESPONSAVEIS.map((r) => (
                <button key={r} type="button" className="ficha-pessoa" aria-pressed={t.responsavel === r} onClick={() => mudar("responsavel", r)}>
                  <span className={`ficha-bolinha ficha-bolinha-${r}`} aria-hidden>{NOMES.responsavel[r][0]}</span>
                  {NOMES.responsavel[r]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="ficha-campo">
            <legend>Quando</legend>
            <div className="ficha-quando">
              {/* Data e hora no mesmo painel (item 76): calendário + rodas de hora e minuto. Dia inteiro = só o calendário. */}
              <div className="ficha-mini">
                {data && !t.diaInteiro ? "Começa" : "Data"}
                <CampoData rotulo={data && !t.diaInteiro ? "Começa" : "Data"} valor={data} hora={t.diaInteiro ? undefined : data ? horaIni : ""}
                  aoMudar={(d, h) => mudarInicio(d, h || horaIni)} />
              </div>
              {data && (
                <label className="ficha-marcar">
                  <input type="checkbox" checked={t.diaInteiro} onChange={(e) => mudar("diaInteiro", e.target.checked)} />
                  Dia inteiro
                </label>
              )}
              {data && !t.diaInteiro && (
                <div className="ficha-mini">
                  Termina
                  <CampoData rotulo="Termina" valor={horaFim ? dataFim || data : ""} hora={horaFim} min={data} vazio="Sem fim"
                    aoMudar={(d, h) => { setDataFim(d); setHoraFim(h ?? ""); }} />
                </div>
              )}
            </div>
            {!data && <p className="ficha-dica">Sem data: a tarefa fica na coluna &quot;Sem data&quot; do calendário.</p>}
          </fieldset>

          <fieldset className="ficha-campo">
            <legend>Cor</legend>
            <div className="ficha-cores" role="group" aria-label="Cor da etiqueta">
              {ETIQUETAS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={t.cor === c}
                  aria-label={`Cor ${i + 1}`}
                  className="ficha-cor"
                  style={{ background: `var(--${c})` }}
                  onClick={() => mudar("cor", c)}
                />
              ))}
            </div>
          </fieldset>

          {t.tipo === "postagem" && (
            <Campo rotulo="Objetivo">
              <input value={t.objetivo ?? ""} onChange={(e) => mudar("objetivo", e.target.value)} placeholder="Para que serve este conteúdo?" />
            </Campo>
          )}

          <Campo rotulo="Notas">
            <textarea rows={3} value={t.notas ?? ""} onChange={(e) => mudar("notas", e.target.value)} placeholder="Ideias, roteiro, combinados..." />
          </Campo>

          <fieldset className="ficha-campo">
            <legend>Links do Drive</legend>
            {links.map((l, i) => (
              <div key={i} className="ficha-link">
                <input aria-label="Nome do link" value={l.rotulo} placeholder="Nome" onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, rotulo: e.target.value } : x)))} />
                <input aria-label="Endereço do link" type="url" value={l.url} placeholder="https://drive.google.com/..." onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                {LINK_VALIDO.test(l.url) && <a href={l.url} target="_blank" rel="noreferrer noopener">Abrir</a>}
                <button type="button" className="ficha-texto-botao" onClick={() => setLinks(links.filter((_, j) => j !== i))}>Tirar</button>
              </div>
            ))}
            <button type="button" className="ficha-texto-botao" onClick={() => setLinks([...links, { rotulo: "", url: "" }])}>+ Adicionar link</button>
          </fieldset>
        </div>

        <footer className="ficha-pe">
          {!nova && <button type="button" className="ficha-texto-botao ficha-excluir" onClick={excluir}>Excluir</button>}
          <button type="button" className="btn btn-2" onClick={() => dialogo.current?.close()}>Cancelar</button>
          <button type="submit" className="btn" disabled={!t.titulo.trim() || !temEmpresa}>Salvar</button>
        </footer>
      </form>
    </dialog>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return <label className="ficha-campo"><span className="ficha-legenda">{rotulo}</span>{children}</label>;
}

// Fim só vale se vier depois do início; senão a tarefa fica sem fim (vira um ponto no horário).
function fimValido(dia: string, ini: string, diaFim: string, fim: string) {
  if (!fim) return undefined;
  const a = `${dia}T${ini}`, b = `${diaFim}T${fim}`;
  return b > a ? b : undefined;
}
