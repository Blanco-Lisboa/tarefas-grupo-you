"use client";
import { useState } from "react";
import { useEmpresas, useIdeias, usePecas, type Empresa, type Peca, type TipoPeca } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { receitaDaEmpresa, tomDaEmpresa } from "./cores";
import { CardIdeias } from "./CardIdeias";
import { CardPeca } from "./CardPeca";
import { PastaDeVidro } from "./PastaDeVidro";

const PASTAS: { tipo: TipoPeca; rotulo: string }[] = [
  { tipo: "post", rotulo: "Posts" },
  { tipo: "carrossel", rotulo: "Carrosséis" },
  { tipo: "video", rotulo: "Vídeos" },
  { tipo: "story", rotulo: "Stories" },
];

// Uma empresa: as pastas dela na cor dela e o card flutuante (peça ou ideias) que abre ao clicar num cartão.
function Faixa({ empresa, pecas }: { empresa: Empresa; pecas: Peca[] }) {
  const { ideias } = useIdeias(empresa.id);
  const [aberto, setAberto] = useState<{ peca: Peca } | { ideias: string } | null>(null);
  const t = tomDaEmpresa(empresa.id);
  const tom = { base: t.r, sombra: `${t.g}99` };
  const categorias = [...new Set(ideias.map((i) => i.categoria))];

  return (
    <div className="pastas-empresa">
      <h2>
        {empresa.nome} <small>{pecas.length} peças</small>
      </h2>
      <div className="pastas-grade">
        {PASTAS.map(({ tipo, rotulo }, i) => {
          const daPasta = pecas.filter((p) => p.tipo === tipo);
          const arte = receitaDaEmpresa(tipo, empresa.id);
          return (
            <div key={tipo} className="pastas-cel">
              <PastaDeVidro
                rotulo={rotulo}
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
            legenda={`${ideias.length} ideias`}
            tom={tom}
            arte={receitaDaEmpresa("story", empresa.id)}
            seed={19}
            atraso={4 * 120}
            arquivos={categorias.map((c) => ({ nome: c, meta: `${ideias.filter((i) => i.categoria === c).length} ideias`, arte: receitaDaEmpresa("story", empresa.id) }))}
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
  const mostradas = empresas.filter((e) => todas || selecionadas.includes(e.id));

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
