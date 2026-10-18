"use client";

import { useState, type FormEvent } from "react";
import { removerEmpresa, salvarEmpresa, useEmpresas, usePecas, useTarefas, type Empresa } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import "./configuracoes.css";

function sigla(nome: string) {
  return nome.trim().split(/\s+/).map((parte) => parte[0]).join("").slice(0, 2).toLocaleUpperCase("pt-BR");
}

export function TelaConfiguracoes() {
  const empresas = useEmpresas();
  const tarefas = useTarefas();
  const pecas = usePecas();
  const { selecionadas, alternar } = useFiltroEmpresa();
  const [novoNome, setNovoNome] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [nomeEditado, setNomeEditado] = useState("");
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  async function incluir(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nome = novoNome.trim();
    if (!nome) return;
    if (empresas.some((empresa) => empresa.nome.toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR"))) {
      setErro("Essa empresa já está cadastrada.");
      return;
    }
    try {
      setErro("");
      await salvarEmpresa({ id: crypto.randomUUID(), nome, sigla: sigla(nome) });
      setNovoNome("");
    } catch { setErro("Não foi possível incluir a empresa. Tente novamente."); }
  }

  async function renomear(empresa: Empresa) {
    const nome = nomeEditado.trim();
    if (!nome) { setErro("Informe um nome para a empresa."); return; }
    if (empresas.some((item) => item.id !== empresa.id && item.nome.toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR"))) {
      setErro("Essa empresa já está cadastrada."); return;
    }
    try {
      setErro("");
      await salvarEmpresa({ ...empresa, nome, sigla: sigla(nome) });
      setEditando(null);
    } catch { setErro("Não foi possível renomear a empresa. Tente novamente."); }
  }

  async function tirar(id: string) {
    try {
      setErro("");
      await removerEmpresa(id);
      if (selecionadas.includes(id)) alternar(id);
      setRemovendo(null);
    } catch { setErro("Não foi possível tirar a empresa. Tente novamente."); }
  }

  return (
    <section className="config-tela">
      <header className="config-cabecalho">
        <h1>Configurações</h1>
        <p>Cadastre as empresas que aparecem na grade de conteúdo.</p>
      </header>
      {erro && <p className="config-erro" role="alert">{erro}</p>}
      <section className="config-bloco" aria-labelledby="config-empresas-titulo">
        <div className="config-bloco-topo"><h2 id="config-empresas-titulo">Empresas</h2><span>{empresas.length} cadastradas</span></div>
        <ul className="config-lista">
          {empresas.map((empresa) => {
            const quantidade = tarefas.filter((t) => t.empresaId === empresa.id).length;
            const quantidadePecas = pecas.filter((p) => p.empresaId === empresa.id).length;
            return (
              <li className="config-empresa" key={empresa.id}>
                <span className="config-monograma" aria-hidden="true">{empresa.sigla}</span>
                <div className="config-empresa-corpo">
                  {editando === empresa.id ? (
                    <form className="config-edicao" onSubmit={(evento) => { evento.preventDefault(); void renomear(empresa); }}>
                      <label className="config-escondido" htmlFor={`config-nome-${empresa.id}`}>Nome da empresa</label>
                      <input id={`config-nome-${empresa.id}`} autoFocus value={nomeEditado} onChange={(evento) => setNomeEditado(evento.target.value)} maxLength={80} required />
                      <button className="config-botao" type="submit">Salvar</button>
                      <button className="config-botao-texto" type="button" onClick={() => setEditando(null)}>Cancelar</button>
                    </form>
                  ) : <><strong>{empresa.nome}</strong><span>{quantidade} {quantidade === 1 ? "tarefa" : "tarefas"}</span></>}
                  {removendo === empresa.id && (
                    <div className="config-confirmacao" role="alertdialog" aria-label={`Confirmar exclusão de ${empresa.nome}`}>
                      <p>Tirar {empresa.nome}? {quantidade} {quantidade === 1 ? "tarefa será removida" : "tarefas serão removidas"} e {quantidadePecas} {quantidadePecas === 1 ? "peça sumirá" : "peças sumirão"} das Pastas. Não dá para recuperar depois.</p>
                      <div><button className="config-botao-perigo" type="button" onClick={() => void tirar(empresa.id)}>Sim, tirar empresa</button><button className="config-botao-texto" type="button" onClick={() => setRemovendo(null)}>Cancelar</button></div>
                    </div>
                  )}
                </div>
                {editando !== empresa.id && removendo !== empresa.id && <div className="config-acoes">
                  <button type="button" onClick={() => { setEditando(empresa.id); setNomeEditado(empresa.nome); setErro(""); }}>Renomear</button>
                  <button type="button" onClick={() => { setRemovendo(empresa.id); setErro(""); }}>Tirar</button>
                </div>}
              </li>
            );
          })}
        </ul>
      </section>
      <form className="config-incluir" onSubmit={(evento) => void incluir(evento)}>
        <h2>Incluir empresa</h2>
        <label htmlFor="config-nova-empresa">Nome da empresa</label>
        <div><input id="config-nova-empresa" value={novoNome} onChange={(evento) => setNovoNome(evento.target.value)} placeholder="Ex.: Lavoro Piu" maxLength={80} required /><button className="config-botao" type="submit">Incluir</button></div>
      </form>
    </section>
  );
}
