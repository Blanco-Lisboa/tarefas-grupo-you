"use client";
import { useState } from "react";
import { criarOcasiao, renomearOcasiao, useOcasioes } from "@/lib/dados";
import { Selecao } from "@/components/ui/Selecao";
import "./anexos.css";

// Ocasião (item 203) = a pasta do Drive do card dentro da empresa (Tarefas · Conteúdos > Empresa > Ocasião).
// Escolher não mexe no Drive; "Nova ocasião" e "Renomear" chamam a função `drive`, que cria e renomeia a pasta de verdade.
// Card sem ocasião ganha uma sozinha (com o título dele) na primeira vez que recebe um anexo.
export function CampoOcasiao({ empresaId, valor, aoMudar }: { tarefaId?: string; empresaId: string; valor?: string; aoMudar: (ocasiaoId: string | undefined) => void }) {
  const todas = useOcasioes();
  const daEmpresa = todas.filter((o) => o.empresaId === empresaId);
  const atual = daEmpresa.find((o) => o.id === valor);
  const [modo, setModo] = useState<"nova" | "renomear" | null>(null);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  if (!empresaId) return null;

  async function confirmar() {
    const limpo = nome.trim();
    if (!limpo || ocupado) return;
    setOcupado(true);
    setErro("");
    try {
      if (modo === "nova") aoMudar((await criarOcasiao(empresaId, limpo)).id);
      else if (atual) await renomearOcasiao(atual.id, limpo);
      setModo(null);
      setNome("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui salvar a ocasião.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="ficha-campo ficha-escolha">
      <Selecao
        rotulo="Ocasião"
        opcoes={daEmpresa.map((o) => ({ valor: o.id, rotulo: o.nome }))}
        valor={atual ? [atual.id] : []}
        multipla={false}
        rotuloTodos="Sem ocasião"
        vazio="Escolher"
        aoMudar={([v]) => aoMudar(v)}
        acao={{ rotulo: "Nova ocasião", aoClicar: () => { setModo("nova"); setNome(""); setErro(""); } }}
      />
      {atual && !modo && <button type="button" className="ficha-texto-botao" onClick={() => { setModo("renomear"); setNome(atual.nome); setErro(""); }}>Renomear a pasta</button>}
      {modo && (
        <div className="ficha-tag-nova">
          <input value={nome} maxLength={120} autoFocus aria-label={modo === "nova" ? "Nome da nova ocasião" : "Novo nome da ocasião"} placeholder={modo === "nova" ? "Ex.: Dia das Mães" : ""} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void confirmar(); } }} />
          <button type="button" className="ficha-texto-botao" disabled={ocupado} onClick={() => void confirmar()}>{modo === "nova" ? "Criar" : "Renomear"}</button>
          <button type="button" className="ficha-texto-botao" onClick={() => setModo(null)}>Cancelar</button>
        </div>
      )}
      {erro && <small className="ficha-anexo-recusa" role="alert">{erro}</small>}
    </div>
  );
}
