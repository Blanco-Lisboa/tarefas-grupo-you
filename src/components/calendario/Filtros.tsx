"use client";
import { ETAPAS, REDES, RESPONSAVEIS, TIPOS, type Tarefa } from "@/lib/dados";
import { NOMES } from "@/components/ficha/Ficha";
import { Selecao } from "@/components/ui/Selecao";

// Filtros SÓ do calendário (pessoa, rede, etapa, tipo). Somam com o filtro global de empresa, que a casca desenha.
// Grupo vazio = sem filtro naquele grupo.
export type Filtros = { responsavel: string[]; rede: string[]; etapa: string[]; tipo: string[] };
export const SEM_FILTROS: Filtros = { responsavel: [], rede: [], etapa: [], tipo: [] };

export const passa = (f: Filtros) => (t: Tarefa) =>
  (Object.keys(f) as (keyof Filtros)[]).every((g) => !f[g].length || f[g].includes(t[g] ?? ""));

const GRUPOS = [
  { g: "responsavel", rotulo: "Pessoa", valores: RESPONSAVEIS },
  { g: "rede", rotulo: "Rede", valores: REDES },
  { g: "etapa", rotulo: "Etapa", valores: ETAPAS },
  { g: "tipo", rotulo: "Tipo", valores: TIPOS },
] as const;

// Cada grupo é um botão de seleção (item 42, componente da base).
export function BarraFiltros({ filtros, mudar }: { filtros: Filtros; mudar: (f: Filtros) => void }) {
  const ativos = Object.values(filtros).flat().length;
  return (
    <div className="cal-filtros" role="group" aria-label="Filtros do calendário">
      {GRUPOS.map(({ g, rotulo, valores }) => (
        <Selecao
          key={g}
          rotulo={rotulo}
          valor={filtros[g]}
          aoMudar={(v) => mudar({ ...filtros, [g]: v })}
          opcoes={valores.map((v) => ({
            valor: v,
            rotulo: (NOMES[g] as Record<string, string>)[v],
            antes: g === "responsavel" ? <span className={`evento-bolinha evento-bolinha-${v}`} aria-hidden>{v[0].toUpperCase()}</span> : undefined,
          }))}
        />
      ))}
      {ativos > 0 && (
        <button type="button" className="lnk cal-limpar" onClick={() => mudar(SEM_FILTROS)}>
          <span className="sub">Limpar {ativos === 1 ? "1 filtro" : `${ativos} filtros`}</span>
        </button>
      )}
    </div>
  );
}
