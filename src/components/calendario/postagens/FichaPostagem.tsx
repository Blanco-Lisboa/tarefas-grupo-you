"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { apagarPlanejada, lerSerie, salvarPlanejada, useEmpresas, usePostagensCalendario, type EscopoPostagem, type Ocorrencia, type Planejada, type RedePost, type Responsavel } from "@/lib/dados";
import { Confirmar } from "@/components/ficha/Confirmar";
import { NOMES } from "@/components/ficha/Ficha";
import { tomDaEmpresa } from "@/lib/cores-empresa";
import { CampoData } from "@/components/ui/CampoData";
import { Pessoa } from "@/components/ui/Pessoa";
import { Selecao } from "@/components/ui/Selecao";
import { SeloEmpresa } from "@/components/ui/Marca";
import { diaCurto } from "../logica";
import { comODia, DIAS_SEMANA, diasRepetidos, faltaPreencher, HORAS, janelaDaPlanejada, paraGravar, soHoraQuemTitulo } from "./logica";
import { PerguntaEscopo } from "./PerguntaEscopo";

const FORMATOS = Object.entries(NOMES.formato).map(([valor, rotulo]) => ({ valor, rotulo }));
const REDES: { valor: RedePost; rotulo: string }[] = [{ valor: "instagram", rotulo: "Instagram" }, { valor: "facebook", rotulo: "Facebook" }];
const META = "meta"; // valor da opção "Qualquer hora" (a Seleção ignora valor vazio)
const QUEM: Responsavel[] = ["matheus", "natham", "adrian"]; // quem tem Caderno (o Lucas não tem login)
const REPETE = [{ v: "data", nome: "Só nesta data" }, { v: "semana", nome: "Toda semana" }] as const;

type Pergunta = "repetida" | "salvar" | "apagar" | "apagar-unica" | null;

/** Criar (sem `ocorrencia`) ou editar uma postagem planejada. Só o Natham chega aqui; o banco confere de novo (42501). */
export function FichaPostagem({ inicial, ocorrencia, aoFechar }: { inicial: Planejada; ocorrencia?: Ocorrencia; aoFechar: () => void }) {
  const empresas = useEmpresas();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [t, setT] = useState<Planejada | null>(ocorrencia ? null : inicial);
  const [antes, setAntes] = useState<Planejada | null>(ocorrencia ? null : inicial); // a série como está no banco
  const [aberta, setAberta] = useState<Planejada | null>(ocorrencia ? null : inicial); // o que a ficha mostrou ao abrir (com o "só este dia")
  const [pergunta, setPergunta] = useState<Pergunta>(null);
  const [aviso, setAviso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const nova = !ocorrencia;

  useEffect(() => { if (dialogo.current && !dialogo.current.open) dialogo.current.showModal(); }, []);
  useEffect(() => {
    if (!ocorrencia?.planejadaId) return;
    let vivo = true;
    void lerSerie(ocorrencia.planejadaId).then((s) => {
      if (!vivo) return;
      if (s) { const dia = comODia(s, ocorrencia); setT(dia); setAberta(dia); setAntes(s); } else setAviso("Não consegui abrir esta postagem. Feche e tente de novo.");
    });
    return () => { vivo = false; };
  }, [ocorrencia]); // (objeto estável: vem do estado de Postagens, e a chave do componente já é planejada+dia)

  const mudar = (parte: Partial<Planejada>) => setT((x) => (x ? { ...x, ...parte } : x));
  const falta = t ? faltaPreencher(t) : "";
  const repete = !nova && antes?.repete === "semana";
  // Lince 27/10: outra planejada da mesma empresa e formato nos mesmos dias faz o post casar com só uma (a outra fica em aberto). Avisa antes.
  const janela = janelaDaPlanejada(t ?? inicial);
  const { itens: vizinhos } = usePostagensCalendario(janela.de || inicial.inicio || "", janela.ate || inicial.inicio || "");
  const repetidos = t && vizinhos ? diasRepetidos(t, vizinhos) : [];
  const seguir = () => { if (repete) setPergunta("salvar"); else void gravar("todos"); };

  async function gravar(escopo: EscopoPostagem) {
    if (!t || !antes || !aberta) return;
    setPergunta(null); setSalvando(true); setAviso("");
    const r = await salvarPlanejada(paraGravar(antes, aberta, t, escopo), escopo, ocorrencia?.dia);
    setSalvando(false);
    if (r.erro) setAviso(r.erro); else dialogo.current?.close();
  }
  async function apagar(escopo: EscopoPostagem) {
    if (!ocorrencia?.planejadaId) return;
    setPergunta(null); setSalvando(true); setAviso("");
    const erro = await apagarPlanejada(ocorrencia.planejadaId, escopo, ocorrencia.dia);
    setSalvando(false);
    if (erro) setAviso(erro); else dialogo.current?.close();
  }
  const dia = (n: number) => !!t?.diasSemana?.includes(n);

  return (
    <dialog ref={dialogo} className="ficha pficha" aria-label={nova ? "Nova postagem" : "Postagem planejada"} onClose={aoFechar}
      onClick={(e) => e.target === e.currentTarget && dialogo.current?.close()}>
      <form className="ficha-cartao" onSubmit={(e) => { e.preventDefault(); if (!falta && !salvando) { if (repetidos.length) setPergunta("repetida"); else seguir(); } }}
        style={{ "--etiqueta-atual": t?.empresaId ? tomDaEmpresa(t.empresaId).r : "var(--borda)" } as CSSProperties}>
        <header className="ficha-faixa">
          <div className="ficha-faixa-topo">
            <span className="ficha-rotulo"><span className="ficha-cor-marca" aria-hidden />{nova ? "Nova postagem" : "Postagem planejada"}
              {ocorrencia && repete && <span>· dia {ocorrencia.dia.slice(8)}/{ocorrencia.dia.slice(5, 7)}</span>}</span>
            <button type="button" className="ficha-fechar" onClick={() => dialogo.current?.close()}>Fechar</button>
          </div>
          <p className="pficha-ajuda">{t && !t.hora ? "Meta do dia: tem de sair no dia, a qualquer hora. Fica só aqui no calendário, sem tarefa no Caderno." : "O que precisa ser postado. Cada dia vira uma tarefa no Caderno de quem posta."}</p>
        </header>

        {!t ? <p className="pficha-carregando" aria-busy={!aviso}>{aviso || "Abrindo..."}</p> : (
          <fieldset className="ficha-corpo" disabled={salvando}>
            <div className="ficha-grade">
              <div className="ficha-campo ficha-escolha">
                <Selecao rotulo="Empresa" multipla={false} vazio="Escolher" valor={t.empresaId ? [t.empresaId] : []} aoMudar={([v]) => v && mudar({ empresaId: v })}
                  opcoes={empresas.map((e) => ({ valor: e.id, rotulo: e.nome, antes: <SeloEmpresa empresaId={e.id} nome={e.nome} tamanho={18} /> }))} />
              </div>
              <div className="ficha-campo ficha-escolha">
                <Selecao rotulo="Formato" multipla={false} valor={[t.formato]} opcoes={FORMATOS} aoMudar={([v]) => v && mudar({ formato: v as Planejada["formato"] })} />
              </div>
              <div className="ficha-campo ficha-escolha">
                <Selecao rotulo="Redes" valor={t.redes} opcoes={REDES} aoMudar={(v) => mudar({ redes: v as RedePost[] })} />
              </div>
              <div className="ficha-campo ficha-escolha">
                <Selecao rotulo="Hora" multipla={false} valor={[t.hora || META]} opcoes={[{ valor: META, rotulo: "Qualquer hora (meta do dia)" }, ...HORAS.map((h) => ({ valor: h, rotulo: h }))]}
                  aoMudar={([v]) => v && mudar({ hora: v === META ? "" : v })} />
              </div>
            </div>

            <fieldset className="ficha-campo">
              <legend>Quem posta</legend>
              <div className="ficha-pessoas">
                {QUEM.map((r) => (
                  <button key={r} type="button" className="pficha-pessoa" aria-pressed={(t.responsavel ?? "matheus") === r} onClick={() => mudar({ responsavel: r })}>
                    <Pessoa quem={r} tamanho={20} />{NOMES.responsavel[r]}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="ficha-campo">
              <span className="ficha-legenda">Título ou observação <span className="pficha-opc">(opcional)</span></span>
              <input className="pficha-texto" type="text" maxLength={200} value={t.titulo ?? ""} onChange={(e) => mudar({ titulo: e.target.value })} placeholder="Ex.: dica rápida do MEI" />
            </label>

            <fieldset className="ficha-campo">
              <legend>Repetição</legend>
              <div className="pficha-troca" role="group" aria-label="Repetição">
                {REPETE.map((r) => (
                  <button key={r.v} type="button" aria-pressed={t.repete === r.v} disabled={repete && r.v !== "semana"} onClick={() => mudar({ repete: r.v })}>{r.nome}</button>
                ))}
              </div>
              {t.repete === "data" ? (
                <CampoData rotulo="Dia" valor={t.data ?? ""} aoMudar={(d) => mudar({ data: d, inicio: d })} semLimpar />
              ) : (
                <>
                  <div className="pficha-dias" role="group" aria-label="Dias da semana">
                    {DIAS_SEMANA.map((d) => (
                      <button key={d.n} type="button" aria-pressed={dia(d.n)}
                        onClick={() => mudar({ diasSemana: dia(d.n) ? t.diasSemana!.filter((x) => x !== d.n) : [...(t.diasSemana ?? []), d.n] })}>{d.nome}</button>
                    ))}
                  </div>
                  <div className="ficha-grade">
                    <CampoData rotulo="Começa em" valor={t.inicio ?? ""} aoMudar={(d) => mudar({ inicio: d })} semLimpar />
                    <CampoData rotulo="Termina em (opcional)" valor={t.fim ?? ""} min={t.inicio} aoMudar={(d) => mudar({ fim: d || undefined })} />
                  </div>
                </>
              )}
            </fieldset>
          </fieldset>
        )}

        <footer className="ficha-pe">
          {!nova && t && (
            <button type="button" className="ficha-lixeira" aria-label="Apagar postagem" title="Apagar postagem" onClick={() => setPergunta(repete ? "apagar" : "apagar-unica")}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6M8.5 9v4M11.5 9v4" /></svg>
            </button>
          )}
          {aviso && t && <p className="ficha-erro" role="alert">{aviso}</p>}
          {!aviso && falta && t && <p className="pficha-falta">{falta}</p>}
          <button type="button" className="btn btn-2" onClick={() => dialogo.current?.close()}>Cancelar</button>
          <button type="submit" className="btn" disabled={!t || !!falta || salvando}>{salvando ? "Salvando..." : "Salvar"}</button>
        </footer>
      </form>
      {pergunta === "repetida" && t && (
        <Confirmar titulo={`Já existe ${NOMES.formato[t.formato]} da ${empresas.find((e) => e.id === t.empresaId)?.nome ?? t.empresaId} ${repetidos.length === 1 ? "neste dia" : "nestes dias"}`}
          texto={`${repetidos.length === 1 ? "No dia" : "Nos dias"} ${repetidos.slice(0, 3).map(diaCurto).join(", ")}${repetidos.length > 3 ? ` e mais ${repetidos.length - 3}` : ""} já tem outra postagem planejada igual. Um post só cumpre uma delas e a outra fica em aberto. Salvar mesmo assim?`}
          acao="Salvar mesmo assim" aoConfirmar={seguir} aoCancelar={() => setPergunta(null)} />
      )}
      {pergunta === "salvar" && t && antes && (
        <PerguntaEscopo titulo="Salvar a mudança" semDia={soHoraQuemTitulo(antes, t) ? undefined : "Só hora, quem posta e título mudam em um dia só."}
          aoEscolher={(e) => void gravar(e)} aoCancelar={() => setPergunta(null)} />
      )}
      {pergunta === "apagar" && <PerguntaEscopo titulo="Apagar postagem" perigo aoEscolher={(e) => void apagar(e)} aoCancelar={() => setPergunta(null)} />}
      {pergunta === "apagar-unica" && (
        <Confirmar titulo="Apagar esta postagem?" texto="As tarefas dela que ainda não foram feitas saem do Caderno. As que já foram feitas ficam." acao="Apagar" perigo
          aoConfirmar={() => void apagar("todos")} aoCancelar={() => setPergunta(null)} />
      )}
    </dialog>
  );
}
