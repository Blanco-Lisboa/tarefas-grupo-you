"use client";
import { useState } from "react";
import { useEmpresas, useIdeias, usePecas, type Empresa, type Peca, type TipoPeca } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { SeloEmpresa } from "@/components/ui/Marca";
import { receitaDaEmpresa, tomDaEmpresa } from "./cores";
import { CardIdeias } from "./CardIdeias";
import { CardPeca } from "./CardPeca";
import { PastaDeVidro } from "./PastaDeVidro";

const nIdeias = (n: number) => (n === 1 ? "1 ideia" : `${n} ideias`);

type Pasta = { tipo: TipoPeca; rotulo: string; vazio?: string };

// "Adrian - Aprovar" é só da You e começa vazia: ainda não há onde guardar o que espera a aprovação, então não aceita peça de nenhum tipo.
const PASTA_ADRIAN: Pasta = { tipo: "video", rotulo: "Adrian - Aprovar", vazio: "Nenhum vídeo esperando o Adrian aprovar." };

const PASTAS: Pasta[] = [
  { tipo: "post", rotulo: "Posts" },
  { tipo: "carrossel", rotulo: "Carrosséis" },
  { tipo: "video", rotulo: "Vídeos" },
  { tipo: "story", rotulo: "Stories" },
];
const PASTAS_YOU: Pasta[] = [PASTAS[0], PASTAS[1], PASTAS[2], PASTA_ADRIAN, PASTAS[3]];

// Uma empresa: as pastas dela na cor dela e o card flutuante (peça ou ideias) que abre ao clicar num cartão.
function Faixa({ empresa, pecas }: { empresa: Empresa; pecas: Peca[] }) {
  const { ideias } = useIdeias(empresa.id);
  const [aberto, setAberto] = useState<{ peca: Peca } | { ideias: string } | null>(null);
  const t = tomDaEmpresa(empresa.id);
  const tom = { base: t.r, sombra: `${t.g}99` };
  const pastasDaEmpresa = empresa.id === "you" ? PASTAS_YOU : PASTAS;
  const categorias = [...new Set(ideias.map((i) => i.categoria))];

  return (
    <div className="pastas-empresa">
      <h2>
        <SeloEmpresa empresaId={empresa.id} nome={empresa.nome} tamanho={28} comNome /> <small>{pecas.length} peças</small>
      </h2>
      <div className="pastas-grade">
        {pastasDaEmpresa.map(({ tipo, rotulo, vazio }, i) => {
          const daPasta = vazio ? [] : pecas.filter((p) => p.tipo === tipo);
          const arte = receitaDaEmpresa(tipo, empresa.id);
          return (
            <div key={rotulo} className="pastas-cel">
              <PastaDeVidro
                rotulo={rotulo}
                vazio={vazio}
                tom={tom}
                arte={arte}
                seed={3 + i * 4}
                atraso={i * 120}
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
            atraso={pastasDaEmpresa.length * 120}
            arquivos={categorias.map((c) => ({ nome: c, meta: nIdeias(ideias.filter((i) => i.categoria === c).length), arte: receitaDaEmpresa("story", empresa.id) }))}
            onSelecionar={(a) => setAberto({ ideias: a.nome })}
          />
        </div>
      </div>
      {aberto && "peca" in aberto && <CardPeca peca={aberto.peca} empresa={empresa} aoFechar={() => setAberto(null)} />}
      {aberto && "ideias" in aberto && <CardIdeias empresaId={empresa.id} inicio={aberto.ideias} aoFechar={() => setAberto(null)} />}
    </div>
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
