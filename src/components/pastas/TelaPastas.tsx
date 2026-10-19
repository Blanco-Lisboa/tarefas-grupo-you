"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { nomeEmUso, useEmpresas, useIdeias, usePastas, usePecas, type Empresa, type Pasta, type Peca } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { SeloEmpresa } from "@/components/ui/Marca";
import { receitaDaEmpresa, tomDaEmpresa } from "./cores";
import { CardIdeias } from "./CardIdeias";
import { CardPeca } from "./CardPeca";
import { CardFlutuante } from "./CardFlutuante";
import { MenuPasta } from "./MenuPasta";
import { PastaDeVidro } from "./PastaDeVidro";

const nIdeias = (n: number) => (n === 1 ? "1 ideia" : `${n} ideias`);

// Uma empresa: as pastas dela na cor dela e o card flutuante (peça ou ideias) que abre ao clicar num cartão.
function Faixa({ empresa, pecas }: { empresa: Empresa; pecas: Peca[] }) {
  const { ideias } = useIdeias(empresa.id);
  const { pastas, criar, renomear, excluir } = usePastas(empresa.id);
  const [aberto, setAberto] = useState<{ peca: Peca } | { ideias: string } | null>(null);
  // nome: pasta nova (id vazio) ou renomeando; excluir: pedindo a confirmação
  const [nome, setNome] = useState<{ id?: string } | null>(null);
  const [excluir_, setExcluir] = useState<Pasta | null>(null);
  const t = tomDaEmpresa(empresa.id);
  const tom = { base: t.r, sombra: `${t.g}99` };
  const categorias = [...new Set(ideias.map((i) => i.categoria))];

  return (
    <div className="pastas-empresa">
      <h2>
        <SeloEmpresa empresaId={empresa.id} nome={empresa.nome} tamanho={28} comNome /> <small>{pecas.length} peças</small>
        <button type="button" className="btn pastas-nova" onClick={() => setNome({})}>+ Nova pasta</button>
      </h2>
      <div className="pastas-grade">
        {pastas.map((pasta, i) => {
          const { rotulo, vazio } = { rotulo: pasta.nome, vazio: pasta.vazio };
          const daPasta = vazio || !pasta.tipo ? [] : pecas.filter((p) => p.tipo === pasta.tipo);
          const arte = receitaDaEmpresa(pasta.tipo ?? "post", empresa.id);
          return (
            <div key={pasta.id} className="pastas-cel">
              <PastaDeVidro
                rotulo={rotulo}
                vazio={vazio}
                tom={tom}
                arte={arte}
                seed={3 + i * 4}
                atraso={i * 120}
                acoes={<MenuPasta nome={rotulo} aoRenomear={() => setNome({ id: pasta.id })} aoExcluir={() => setExcluir(pasta)} />}
                arquivos={daPasta.map((p) => ({ nome: p.titulo, meta: p.meta, arte }))}
                onSelecionar={(a) => {
                  const peca = daPasta.find((p) => p.titulo === a.nome);
                  if (peca) setAberto({ peca });
                }}
              />
            </div>
          );
        })}
        <div className="pastas-cel">
          <PastaDeVidro
            rotulo="Ideias de conteúdo"
            legenda={nIdeias(ideias.length)}
            tom={tom}
            arte={receitaDaEmpresa("story", empresa.id)}
            seed={19}
            atraso={pastas.length * 120}
            arquivos={categorias.map((c) => ({ nome: c, meta: nIdeias(ideias.filter((i) => i.categoria === c).length), arte: receitaDaEmpresa("story", empresa.id) }))}
            onSelecionar={(a) => setAberto({ ideias: a.nome })}
          />
        </div>
      </div>
      {nome && (
        <CardNome
          titulo={nome.id ? "Renomear pasta" : "Nova pasta"}
          inicial={pastas.find((p) => p.id === nome.id)?.nome ?? ""}
          emUso={(n) => nomeEmUso(pastas, n, nome.id)}
          aoSalvar={(n) => { if (nome.id) renomear(nome.id, n); else criar(n); setNome(null); }}
          aoFechar={() => setNome(null)}
        />
      )}
      {excluir_ && (
        <CardExcluir
          pasta={excluir_}
          pecas={excluir_.vazio || !excluir_.tipo ? 0 : pecas.filter((p) => p.tipo === excluir_.tipo).length}
          aoConfirmar={() => { excluir(excluir_.id); setExcluir(null); }}
          aoFechar={() => setExcluir(null)}
        />
      )}
      {aberto && "peca" in aberto && <CardPeca peca={aberto.peca} empresa={empresa} aoFechar={() => setAberto(null)} />}
      {aberto && "ideias" in aberto && <CardIdeias empresaId={empresa.id} inicio={aberto.ideias} aoFechar={() => setAberto(null)} />}
    </div>
  );
}

function CardNome({ titulo, inicial, emUso, aoSalvar, aoFechar }: { titulo: string; inicial: string; emUso: (n: string) => boolean; aoSalvar: (n: string) => void; aoFechar: () => void }) {
  const [erro, setErro] = useState("");
  const campo = useRef<HTMLInputElement>(null);
  // o <dialog> só abre depois deste efeito e leva o foco para o X: o foco no campo vem em seguida
  useEffect(() => {
    const t = setTimeout(() => { campo.current?.focus(); campo.current?.select(); });
    return () => clearTimeout(t);
  }, []);
  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const n = String(new FormData(e.currentTarget).get("nome")).trim();
    if (!n) return setErro("Escreva um nome para a pasta.");
    if (emUso(n)) return setErro("Já existe uma pasta com esse nome nesta empresa.");
    aoSalvar(n);
  };
  return (
    <CardFlutuante titulo={titulo} aoFechar={aoFechar}>
      <form className="ideia-form" onSubmit={enviar}>
        <label>Nome da pasta<input ref={campo} name="nome" maxLength={40} defaultValue={inicial} aria-invalid={!!erro} onChange={() => setErro("")} /></label>
        {erro && <p className="pasta-erro" role="alert">{erro}</p>}
        <button type="submit" className="btn">{inicial ? "Salvar" : "Criar pasta"}</button>
      </form>
    </CardFlutuante>
  );
}

function CardExcluir({ pasta, pecas, aoConfirmar, aoFechar }: { pasta: Pasta; pecas: number; aoConfirmar: () => void; aoFechar: () => void }) {
  return (
    <CardFlutuante titulo="Excluir pasta" aoFechar={aoFechar}>
      {pecas > 0 ? (
        <>
          <p className="pasta-texto">A pasta “{pasta.nome}” tem {pecas === 1 ? "1 peça" : `${pecas} peças`} e não pode ser excluída. Só pastas vazias saem: apague ou mova as peças antes.</p>
          <button type="button" className="btn btn-2" onClick={aoFechar}>Entendi</button>
        </>
      ) : (
        <>
          <p className="pasta-texto">Excluir a pasta vazia “{pasta.nome}”? Não dá para desfazer.</p>
          <div className="ideia-acoes">
            <button type="button" className="btn pasta-perigo" onClick={aoConfirmar}>Excluir</button>
            <button type="button" className="btn btn-2" autoFocus onClick={aoFechar}>Manter</button>
          </div>
        </>
      )}
    </CardFlutuante>
  );
}

export function TelaPastas() {
  const empresas = useEmpresas();
  const pecas = usePecas();
  const { aplicar, todas, selecionadas } = useFiltroEmpresa();
  const visiveis = aplicar(pecas);
  // só nas Pastas: a You vem primeiro, as demais empresas seguem na ordem do cadastro
  const mostradas = empresas.filter((e) => todas || selecionadas.includes(e.id)).sort((a, b) => Number(b.id === "you") - Number(a.id === "you"));

  return (
    <section className="pastas">
      <header className="pastas-topo">
        <h1>Pastas</h1>
        <p>Peças prontas e ideias de cada empresa. Abra uma pasta e clique no cartão para ver as informações.</p>
      </header>

      {mostradas.length === 0 && <p className="pastas-vazio">Nenhuma empresa para o filtro atual.</p>}
      {mostradas.map((e) => (
        <Faixa key={e.id} empresa={e} pecas={visiveis.filter((p) => p.empresaId === e.id)} />
      ))}
    </section>
  );
}
