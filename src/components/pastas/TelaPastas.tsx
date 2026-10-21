"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  apagarDocumentoSolto, arvoreDePastas, criarOcasiao, enviarDocumentoNaPasta, ligarPermanente, renomearOcasiao,
  useDocumentosSoltos, useEmpresas, useEu, useIdeias, useOcasioes, useTarefas,
  type DocumentoSolto, type Empresa, type PastaConteudo, type PastaFormato, type PastaTema, type Tarefa,
} from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { FiltroEmpresa } from "@/components/casca/FiltroEmpresa";
import { Ficha, NOMES } from "@/components/ficha/Ficha";
import { SeloEmpresa } from "@/components/ui/Marca";
import { receitaDaEmpresa, tomDaEmpresa } from "./cores";
import { CardIdeias } from "./CardIdeias";
import { CardFlutuante } from "./CardFlutuante";
import { MenuPasta } from "./MenuPasta";
import { PastaDeVidro } from "./PastaDeVidro";

const MS_DIA = 86_400_000;
const nIdeias = (n: number) => (n === 1 ? "1 ideia" : `${n} ideias`);
const nItens = (n: number) => (n === 1 ? "1 item" : `${n} itens`);
const drive = (id: string) => `https://drive.google.com/file/d/${id}/view`;
const mensagem = (e: unknown, padrao: string) => (e instanceof Error ? e.message : padrao);

/** "some em 3 dias" (o Drive manda para a lixeira 7 dias depois de Postado). Vazio quando não vence. */
function someEm(c: PastaConteudo) {
  if (!c.venceEm) return "";
  const dias = Math.max(0, Math.ceil((c.venceEm.getTime() - Date.now()) / MS_DIA));
  return dias === 0 ? "some hoje" : dias === 1 ? "some em 1 dia" : `some em ${dias} dias`;
}

const Cadeado = () => (
  <svg className="pasta-cadeado" viewBox="0 0 20 20" width="18" height="18" aria-label="Permanente" role="img"><rect x="4" y="9" width="12" height="8" rx="2.4" /><path d="M7 9V6.5a3 3 0 0 1 6 0V9" /></svg>
);

type Aberto = { conteudo: Tarefa } | { documento: DocumentoSolto } | { ideias: string | undefined };
type Destino = { formato?: PastaFormato["formato"]; nomeFormato: string; tema: PastaTema };

function Faixa({ empresa }: { empresa: Empresa }) {
  const eu = useEu();
  const { ideias } = useIdeias(empresa.id);
  const tarefas = useTarefas(), ocasioes = useOcasioes(), documentos = useDocumentosSoltos();
  const arvore = arvoreDePastas({ empresaId: empresa.id, tarefas, ocasioes, documentos });
  const [escolhido, setEscolhido] = useState<string | undefined>();
  const [aberto, setAberto] = useState<Aberto | null>(null);
  const [novo, setNovo] = useState(false);
  const [renomeando, setRenomeando] = useState<PastaTema | null>(null);
  const [desligando, setDesligando] = useState<PastaTema | null>(null);
  const [subindo, setSubindo] = useState<Destino | null>(null);
  const [aviso, setAviso] = useState("");
  const t = tomDaEmpresa(empresa.id);
  const tom = { base: t.r, sombra: `${t.g}99` };
  const arte = receitaDaEmpresa("post", empresa.id);
  const categorias = [...new Set(ideias.map((i) => i.categoria))];
  const chave = (f: PastaFormato) => f.formato ?? "sem";
  const itensDe = (f: PastaFormato) => f.temas.reduce((s, p) => s + p.conteudos.length + p.documentos.length, 0);
  const total = arvore.reduce((s, f) => s + itensDe(f), 0);
  // sem escolha, abre o primeiro formato que tem algo (senão o primeiro)
  const atual = arvore.find((f) => chave(f) === escolhido) ?? arvore.find((f) => itensDe(f) > 0) ?? arvore[0];
  const natham = eu === "natham";

  const alternarPermanente = async (p: PastaTema) => {
    if (!p.ocasiao) return;
    try { await ligarPermanente(p.ocasiao.id, !p.permanente); } catch (e) { setAviso(mensagem(e, "Não consegui mudar o Permanente.")); }
  };

  return (
    <div className="pastas-empresa">
      <h2>
        <SeloEmpresa empresaId={empresa.id} nome={empresa.nome} tamanho={28} comNome /> <small>{nItens(total)}</small>
        <button type="button" className="btn pastas-nova" onClick={() => setNovo(true)}>+ Novo tema</button>
      </h2>

      <div className="pastas-grade">
        {arvore.map((f, i) => (
          <div key={chave(f)} className="pastas-cel" data-escolhida={f === atual || undefined}>
            <PastaDeVidro
              rotulo={f.nome}
              legenda={f.temas.length === 0 ? "Pasta vazia" : nItens(itensDe(f))}
              tom={tom}
              arte={receitaDaEmpresa(f.formato === "reels" ? "video" : f.formato === "story" ? "story" : "post", empresa.id)}
              seed={3 + i * 4}
              atraso={i * 120}
              aoMudar={(a) => { if (a) setEscolhido(chave(f)); }}
              arquivos={f.temas.map((p) => ({ id: p.ocasiao?.id ?? "sem-tema", nome: p.nome, meta: p.vazio ? "vazio" : nItens(p.conteudos.length + p.documentos.length), arte }))}
              onSelecionar={() => setEscolhido(chave(f))}
            />
          </div>
        ))}
        {/* Ideias de conteúdo: pasta como as outras, a última da fileira; fora do Drive */}
        <div className="pastas-cel">
          <PastaDeVidro
            rotulo="Ideias de conteúdo"
            legenda={nIdeias(ideias.length)}
            tom={tom}
            arte={receitaDaEmpresa("story", empresa.id)}
            seed={19}
            atraso={arvore.length * 120}
            arquivos={categorias.map((c) => ({ nome: c, meta: nIdeias(ideias.filter((x) => x.categoria === c).length), arte: receitaDaEmpresa("story", empresa.id) }))}
            onSelecionar={(a) => setAberto({ ideias: a.nome })}
          />
        </div>
      </div>

      {atual && (
        <section className="pastas-temas" aria-label={`Temas de ${atual.nome}`}>
          <h3>{atual.nome} <small>temas</small></h3>
          {atual.temas.length === 0 && <p className="pastas-vazio">Nenhum tema aqui ainda. Crie um em “+ Novo tema”.</p>}
          <div className="pastas-grade">
            {atual.temas.map((p, i) => {
              const n = p.conteudos.length + p.documentos.length;
              const podeLigar = !!p.ocasiao && (!p.permanente || natham); // só o Natham desliga: o banco recusa os outros
              return (
                <div key={`${atual.nome}:${p.ocasiao?.id ?? "sem-tema"}`} className="pastas-cel">
                  <PastaDeVidro
                    rotulo={p.nome}
                    legenda={p.vazio ? "Tema vazio" : nItens(n)}
                    vazio="Nada aqui ainda. Suba um documento."
                    tom={tom}
                    arte={arte}
                    seed={31 + i * 4}
                    atraso={i * 120}
                    selo={p.permanente ? <Cadeado /> : undefined}
                    rotuloNova="+ Subir documento"
                    aoNovaFolha={() => setSubindo({ formato: atual.formato, nomeFormato: atual.nome, tema: p })}
                    acoes={p.ocasiao ? (
                      <MenuPasta
                        nome={p.nome}
                        aoRenomear={() => setRenomeando(p)}
                        itens={podeLigar ? [{ rotulo: "Permanente", marcado: p.permanente, aoEscolher: () => (p.permanente ? setDesligando(p) : void alternarPermanente(p)) }] : []}
                      />
                    ) : undefined}
                    arquivos={[
                      ...p.conteudos.map((c) => ({ id: `c:${c.tarefa.id}`, nome: c.tarefa.titulo, meta: [c.tarefa.etapa ? NOMES.etapa[c.tarefa.etapa] : "", someEm(c)].filter(Boolean).join(" · "), arte })),
                      ...p.documentos.map((d) => ({ id: `d:${d.id}`, nome: d.nome, meta: "Documento", arte })),
                    ]}
                    onSelecionar={(a) => {
                      const id = a.id ?? "";
                      if (id.startsWith("c:")) { const c = p.conteudos.find((x) => x.tarefa.id === id.slice(2)); if (c) setAberto({ conteudo: c.tarefa }); }
                      else { const d = p.documentos.find((x) => x.id === id.slice(2)); if (d) setAberto({ documento: d }); }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {novo && (
        <CardNome
          titulo="Novo tema"
          botao="Criar tema"
          comPermanente
          emUso={(n) => ocasioes.some((o) => o.empresaId === empresa.id && o.nome.trim().toLowerCase() === n.toLowerCase())}
          aoSalvar={async (n, permanente) => { await criarOcasiao(empresa.id, n, permanente); setNovo(false); }}
          aoFechar={() => setNovo(false)}
        />
      )}
      {renomeando?.ocasiao && (
        <CardNome
          titulo="Renomear tema"
          botao="Salvar"
          inicial={renomeando.nome}
          emUso={(n) => ocasioes.some((o) => o.empresaId === empresa.id && o.id !== renomeando.ocasiao?.id && o.nome.trim().toLowerCase() === n.toLowerCase())}
          aoSalvar={async (n) => {
            const faltam = await renomearOcasiao(renomeando.ocasiao!.id, n);
            if (faltam > 0) throw new Error(`O tema foi renomeado, mas ${faltam} ${faltam === 1 ? "pasta de conteúdo ficou" : "pastas de conteúdo ficaram"} com o nome antigo. Renomeie de novo para terminar.`);
            setRenomeando(null);
          }}
          aoFechar={() => setRenomeando(null)}
        />
      )}
      {desligando && (
        <CardFlutuante titulo="Desligar Permanente" aoFechar={() => setDesligando(null)}>
          <p className="pasta-texto">Os conteúdos já postados deste tema serão apagados do Drive 7 dias depois de agora.</p>
          <div className="ideia-acoes">
            <button type="button" className="btn pasta-perigo" onClick={() => { const p = desligando; setDesligando(null); void alternarPermanente(p); }}>Desligar</button>
            <button type="button" className="btn btn-2" autoFocus onClick={() => setDesligando(null)}>Manter permanente</button>
          </div>
        </CardFlutuante>
      )}
      {subindo && <CardSubir empresaId={empresa.id} destino={subindo} aoFechar={() => setSubindo(null)} />}
      {aviso && (
        <CardFlutuante titulo="Aviso" aoFechar={() => setAviso("")}>
          <p className="pasta-texto" role="alert">{aviso}</p>
          <button type="button" className="btn btn-2" onClick={() => setAviso("")}>Entendi</button>
        </CardFlutuante>
      )}
      {aberto && "conteudo" in aberto && <Ficha key={aberto.conteudo.id} tarefa={aberto.conteudo} aoFechar={() => setAberto(null)} />}
      {aberto && "documento" in aberto && <CardDocumento doc={aberto.documento} aoFechar={() => setAberto(null)} />}
      {aberto && "ideias" in aberto && <CardIdeias empresaId={empresa.id} inicio={aberto.ideias} aoFechar={() => setAberto(null)} />}
    </div>
  );
}

function CardNome({ titulo, botao, inicial = "", comPermanente, emUso, aoSalvar, aoFechar }: {
  titulo: string; botao: string; inicial?: string; comPermanente?: boolean;
  emUso: (n: string) => boolean; aoSalvar: (n: string, permanente: boolean) => void | Promise<void>; aoFechar: () => void;
}) {
  const [erro, setErro] = useState("");
  const [permanente, setPermanente] = useState(false);
  const campo = useRef<HTMLInputElement>(null);
  // o <dialog> só abre depois deste efeito e leva o foco para o X: o foco no campo vem em seguida
  useEffect(() => {
    const t = setTimeout(() => { campo.current?.focus(); campo.current?.select(); });
    return () => clearTimeout(t);
  }, []);
  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const n = String(new FormData(e.currentTarget).get("nome")).trim();
    if (!n) return setErro("Escreva um nome para o tema.");
    if (emUso(n)) return setErro("Já existe um tema com esse nome nesta empresa.");
    Promise.resolve(aoSalvar(n, permanente)).catch((x: unknown) => setErro(mensagem(x, "Não consegui salvar.")));
  };
  return (
    <CardFlutuante titulo={titulo} aoFechar={aoFechar}>
      <form className="ideia-form" onSubmit={enviar}>
        <label>Nome do tema<input ref={campo} name="nome" maxLength={40} defaultValue={inicial} aria-invalid={!!erro} onChange={() => setErro("")} /></label>
        {comPermanente && (
          <label className="pasta-interruptor">
            <input type="checkbox" role="switch" checked={permanente} onChange={(e) => setPermanente(e.target.checked)} />
            <span className="pasta-trilho" aria-hidden="true" />
            <span><strong>Permanente</strong><small>Os conteúdos postados deste tema ficam no Drive, sem apagar em 7 dias.</small></span>
          </label>
        )}
        {erro && <p className="pasta-erro" role="alert">{erro}</p>}
        <button type="submit" className="btn">{botao}</button>
      </form>
    </CardFlutuante>
  );
}

function CardSubir({ empresaId, destino, aoFechar }: { empresaId: string; destino: Destino; aoFechar: () => void }) {
  const [envio, setEnvio] = useState<{ nome: string; fracao: number } | null>(null);
  const [erro, setErro] = useState("");
  const [feito, setFeito] = useState("");
  const subir = async (arquivo: File) => {
    setErro(""); setFeito(""); setEnvio({ nome: arquivo.name, fracao: 0 });
    try {
      await enviarDocumentoNaPasta({ empresaId, formato: destino.formato, ocasiaoId: destino.tema.ocasiao?.id }, arquivo, (fracao) => setEnvio({ nome: arquivo.name, fracao }));
      setFeito(arquivo.name);
    } catch (e) {
      setErro(mensagem(e, "Não consegui enviar o documento."));
    }
    setEnvio(null);
  };
  const pct = envio ? Math.round(envio.fracao * 100) : 0;
  return (
    <CardFlutuante titulo="Subir documento" aoFechar={aoFechar}>
      <p className="pasta-texto">Vai direto para <strong>{destino.nomeFormato} › {destino.tema.nome}</strong> no Drive. Não vence em 7 dias: só sai quando alguém apagar.</p>
      <label className="btn btn-2 pasta-escolher" aria-disabled={!!envio}>
        Escolher arquivo
        <input type="file" disabled={!!envio} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void subir(f); }} />
      </label>
      {envio && (
        <div className="pasta-progresso" role="status">
          <span>{envio.nome}</span>
          <progress max={100} value={pct} aria-label={`Enviando ${envio.nome}`} />
          <small>{pct}%</small>
        </div>
      )}
      {feito && <p className="pasta-texto" role="status">“{feito}” enviado.</p>}
      {erro && <p className="pasta-erro" role="alert">{erro}</p>}
    </CardFlutuante>
  );
}

function CardDocumento({ doc, aoFechar }: { doc: DocumentoSolto; aoFechar: () => void }) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState("");
  const apagar = async () => {
    try { await apagarDocumentoSolto(doc.id); aoFechar(); } catch (e) { setErro(mensagem(e, "Não consegui apagar.")); }
  };
  return (
    <CardFlutuante titulo={doc.nome} aoFechar={aoFechar}>
      <p className="pasta-texto">{doc.tamanho ? `${(doc.tamanho / 1_000_000).toFixed(1).replace(".", ",")} MB · ` : ""}Documento solto na pasta, não vence em 7 dias.</p>
      {erro && <p className="pasta-erro" role="alert">{erro}</p>}
      {confirmando ? (
        <div className="ideia-acoes">
          <button type="button" className="btn pasta-perigo" onClick={apagar}>Apagar do Drive</button>
          <button type="button" className="btn btn-2" autoFocus onClick={() => setConfirmando(false)}>Manter</button>
        </div>
      ) : (
        <div className="ideia-acoes">
          <a className="btn" href={drive(doc.driveId)} target="_blank" rel="noopener noreferrer">Abrir no Drive</a>
          <button type="button" className="btn btn-2 pasta-excluir" onClick={() => setConfirmando(true)}>Apagar</button>
        </div>
      )}
    </CardFlutuante>
  );
}

export function TelaPastas() {
  const empresas = useEmpresas();
  const { todas, selecionadas } = useFiltroEmpresa();
  // só nas Pastas: a You vem primeiro, as demais empresas seguem na ordem do cadastro
  const mostradas = empresas.filter((e) => todas || selecionadas.includes(e.id)).sort((a, b) => Number(b.id === "you") - Number(a.id === "you"));

  return (
    <section className="pastas">
      <header className="pastas-topo">
        <div className="pastas-quem">
          <h1>Pastas</h1>
          <FiltroEmpresa />
        </div>
        <p>O que está no Drive de cada empresa, por formato e tema. Abra uma pasta e clique no cartão para ver as informações.</p>
      </header>

      {mostradas.length === 0 && <p className="pastas-vazio">Nenhuma empresa para o filtro atual.</p>}
      {mostradas.map((e) => <Faixa key={e.id} empresa={e} />)}
    </section>
  );
}
