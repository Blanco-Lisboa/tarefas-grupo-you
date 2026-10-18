"use client";
import { useState } from "react";
import { useEmpresas, usePecas, type Peca, type TipoPeca } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { hashString, RECEITAS } from "./arte";
import { paint } from "./ArteCanvas";
import { PastaDeVidro } from "./PastaDeVidro";

const PASTAS: { tipo: TipoPeca; rotulo: string }[] = [
  { tipo: "post", rotulo: "Posts" },
  { tipo: "carrossel", rotulo: "Carrosséis" },
  { tipo: "video", rotulo: "Vídeos" },
  { tipo: "story", rotulo: "Stories" },
];
type Modo = "lado" | "exata" | "beec";
const MODOS: { id: Modo; rotulo: string }[] = [
  { id: "lado", rotulo: "Lado a lado" },
  { id: "exata", rotulo: "Só a exata" },
  { id: "beec", rotulo: "Só a adaptada" },
];
// Tamanho real de cada formato. Na Fase 2 o arquivo vem do sistema; por enquanto é uma imagem de exemplo gerada aqui.
const TAMANHO: Record<TipoPeca, [number, number]> = { post: [1080, 1350], carrossel: [1080, 1350], story: [1080, 1920], video: [1080, 1920] };

async function baixar(p: Peca) {
  const [w, h] = TAMANHO[p.tipo];
  const tela = await paint(RECEITAS[p.tipo], hashString(p.titulo) % 997, w, h, 2);
  const blob = await new Promise<Blob | null>((ok) => tela.toBlob(ok, "image/png"));
  if (!blob) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${p.titulo.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function Grade({ pecas, variante }: { pecas: Peca[]; variante: "exata" | "beec" }) {
  return (
    <div className="pastas-grade">
      {PASTAS.map(({ tipo, rotulo }, i) => {
        const daPasta = pecas.filter((p) => p.tipo === tipo);
        return (
          <div key={tipo} className="pastas-cel">
          <PastaDeVidro
            rotulo={rotulo}
            variante={variante}
            arte={RECEITAS[tipo]}
            seed={3 + i * 4}
            atraso={i * 120}
            arquivos={daPasta.map((p) => ({ nome: p.titulo, meta: p.meta, arte: RECEITAS[tipo], href: p.link }))}
            onSelecionar={(a) => {
              const peca = daPasta.find((p) => p.titulo === a.nome);
              if (peca && !peca.link) void baixar(peca);
            }}
          />
          </div>
        );
      })}
    </div>
  );
}

export function TelaPastas() {
  const empresas = useEmpresas();
  const pecas = usePecas();
  const { aplicar, todas, selecionadas } = useFiltroEmpresa();
  const [modo, setModo] = useState<Modo>("lado");
  const visiveis = aplicar(pecas);
  const mostradas = empresas.filter((e) => todas || selecionadas.includes(e.id));

  return (
    <section className="pastas">
      <header className="pastas-topo">
        <div>
          <h1>Pastas</h1>
          <p>Peças prontas de cada empresa. Abra uma pasta e clique na peça: imagem baixa, vídeo abre no Drive.</p>
        </div>
        <div className="pastas-modos" role="group" aria-label="Versão da pasta">
          {MODOS.map((m) => (
            <button key={m.id} type="button" className="pastas-modo" aria-pressed={modo === m.id} onClick={() => setModo(m.id)}>
              {m.rotulo}
            </button>
          ))}
        </div>
      </header>

      {mostradas.length === 0 && <p>Nenhuma empresa para o filtro atual.</p>}
      {mostradas.map((e) => {
        const dela = visiveis.filter((p) => p.empresaId === e.id);
        return (
          <div key={e.id} className="pastas-mesa-pai">
            <div className="pastas-mesa corte-22">
              <h2>
                {e.nome} <small>{dela.length} peças</small>
              </h2>
              <div className="pastas-versoes" data-modo={modo}>
                {modo !== "beec" && (
                  <div>
                    <p className="pastas-versao-nome"><b>Exata</b> · original, cantos redondos e quique</p>
                    <Grade pecas={dela} variante="exata" />
                  </div>
                )}
                {modo !== "exata" && (
                  <div>
                    <p className="pastas-versao-nome"><b>Adaptada Beec</b> · cantos cortados a 22°, sem quique</p>
                    <Grade pecas={dela} variante="beec" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
