"use client";
import { useState } from "react";
import { arquivosDoDrive, arvoreDePastas, criarOcasiao, renomearOcasiao, useEmpresas, useEu, useOcasioes, venceEm, type Formato, type Tarefa } from "@/lib/dados";
import { Selecao } from "@/components/ui/Selecao";
import "./anexos.css";

// Tema (no banco "ocasiao"; itens 203, 220, 229) = a pasta do Drive do card: Tarefas · Conteúdos → Empresa → Formato → Tema → pasta do conteúdo.
// Escolher não mexe no Drive (a Ficha chama organizarCard depois de salvar); "Novo tema" e "Renomear" chamam a função `drive`.
// Tema com cadeado = Permanente: a limpeza dos 7 dias depois de Postado não apaga nada dele. Natham e Matheus podem ligar já ao criar.

/** Cadeado do tema permanente (lista, campo e aviso dos anexos). */
export const Cadeado = () => (
  <svg className="ficha-cadeado" viewBox="0 0 24 24" aria-hidden><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></svg>
);
// Nome da pasta do formato como o Drive escreve (Story → "Stories"): a mesma árvore da tela Pastas.
const PASTAS_FORMATO = arvoreDePastas({ empresaId: "", tarefas: [], ocasioes: [], documentos: [] });
const SEM_TEMA = "Sem tema";

export function CampoOcasiao({ empresaId, formato, valor, aoMudar }: { empresaId: string; formato?: Formato; valor?: string; aoMudar: (ocasiaoId: string | undefined) => void }) {
  const todas = useOcasioes();
  const empresa = useEmpresas().find((e) => e.id === empresaId);
  const eu = useEu();
  const daEmpresa = todas.filter((o) => o.empresaId === empresaId);
  const atual = daEmpresa.find((o) => o.id === valor);
  const [modo, setModo] = useState<"nova" | "renomear" | null>(null);
  const [nome, setNome] = useState("");
  const [permanente, setPermanente] = useState(false);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  if (!empresaId) return null;
  const pastaFormato = PASTAS_FORMATO.find((p) => p.formato === formato)?.nome;

  async function confirmar() {
    const limpo = nome.trim();
    if (!limpo || ocupado) return;
    setOcupado(true);
    setErro("");
    try {
      if (modo === "nova") aoMudar((await criarOcasiao(empresaId, limpo, permanente)).id);
      // O servidor renomeia as pastas aos poucos: devolve quantas ficaram e pede outra chamada.
      else if (atual) for (let i = 0; i < 10 && (await renomearOcasiao(atual.id, limpo)) > 0; i++);
      setModo(null);
      setNome("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui salvar o tema.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="ficha-campo ficha-escolha">
      <Selecao
        rotulo="Tema (pasta no Drive)"
        opcoes={daEmpresa.map((o) => ({ valor: o.id, rotulo: o.nome, antes: o.permanente ? <Cadeado /> : undefined }))}
        valor={atual ? [atual.id] : []}
        multipla={false}
        rotuloTodos={SEM_TEMA}
        vazio="Escolher"
        aoMudar={([v]) => aoMudar(v)}
        acao={{ rotulo: "Novo tema", aoClicar: () => { setModo("nova"); setNome(""); setPermanente(false); setErro(""); } }}
      />
      {atual && !modo && <button type="button" className="ficha-texto-botao" onClick={() => { setModo("renomear"); setNome(atual.nome); setErro(""); }}>Renomear a pasta</button>}
      {modo && (
        <div className="ficha-campo ficha-tag-nova">
          <input value={nome} maxLength={120} autoFocus aria-label={modo === "nova" ? "Nome do novo tema" : "Novo nome do tema"} placeholder={modo === "nova" ? "Ex.: Dia das Mães" : ""} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void confirmar(); } }} />
          {modo === "nova" && (eu === "natham" || eu === "matheus") && (
            <label className="ficha-interruptor" title="Permanente: o que for postado neste tema não some do Drive depois de 7 dias">
              <input type="checkbox" role="switch" checked={permanente} onChange={(e) => setPermanente(e.target.checked)} />
              <Cadeado />Permanente
            </label>
          )}
          <button type="button" className="ficha-texto-botao" disabled={ocupado} onClick={() => void confirmar()}>{modo === "nova" ? "Criar" : "Renomear"}</button>
          <button type="button" className="ficha-texto-botao" onClick={() => setModo(null)}>Cancelar</button>
        </div>
      )}
      <p className="ficha-dica">
        {empresa && pastaFormato
          ? <>Vai para <span className="ficha-caminho">{[empresa.nome, pastaFormato, atual?.nome ?? SEM_TEMA].join(" › ")}</span> no Drive.</>
          : <>O arquivo vai para Empresa › Formato › Tema no Drive. Sem tema, cai em &quot;Sem tema&quot; daquele formato.</>}
      </p>
      {erro && <small className="ficha-anexo-recusa" role="alert">{erro}</small>}
    </div>
  );
}

/** Perto dos anexos (229): card Postado com arquivo no Drive diz quando some de lá, ou que fica (tema com cadeado). */
export function PrazoDrive({ t }: { t: Tarefa }) {
  const tema = useOcasioes().find((o) => o.id === t.ocasiaoId);
  if (t.etapa !== "postado" || !arquivosDoDrive(t).length) return null;
  if (tema?.permanente) return <p className="ficha-dica ficha-dica-fica ficha-prazo"><Cadeado />Fica para sempre (tema com cadeado).</p>;
  const vence = venceEm(t, tema);
  if (!vence) return null;
  const dias = Math.ceil((vence.getTime() - Date.now()) / 86_400_000);
  return <p className="ficha-dica ficha-dica-fica ficha-prazo">{dias <= 0 ? "Some do Drive hoje." : `Some do Drive em ${dias} ${dias === 1 ? "dia" : "dias"}.`}</p>;
}
