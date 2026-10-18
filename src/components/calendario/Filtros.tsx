"use client";
import { ETAPAS, REDES, RESPONSAVEIS, TIPOS, type Tarefa } from "@/lib/dados";
import { NOMES } from "@/components/ficha/Ficha";

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

export function BarraFiltros({ filtros, mudar }: { filtros: Filtros; mudar: (f: Filtros) => void }) {
  const ativos = Object.values(filtros).flat().length;
  const alternar = (g: keyof Filtros, v: string) =>
    mudar({ ...filtros, [g]: filtros[g].includes(v) ? filtros[g].filter((x) => x !== v) : [...filtros[g], v] });
  return (
    <div className="cal-filtros">
      {GRUPOS.map(({ g, rotulo, valores }) => (
        <div key={g} className="cal-filtro" role="group" aria-label={`Filtro de ${rotulo.toLowerCase()}`}>
          <span className="cal-filtro-rotulo">{rotulo}</span>
          {valores.map((v) => (
            <button key={v} type="button" className="cal-chip" aria-pressed={filtros[g].includes(v)} onClick={() => alternar(g, v)}>
              {g === "responsavel" && <span className={`evento-bolinha evento-bolinha-${v}`} aria-hidden>{v[0].toUpperCase()}</span>}
              {(NOMES[g] as Record<string, string>)[v]}
            </button>
          ))}
        </div>
      ))}
      {ativos > 0 && (
        <button type="button" className="cal-limpar" onClick={() => mudar(SEM_FILTROS)}>
          Limpar {ativos === 1 ? "1 filtro" : `${ativos} filtros`}
        </button>
      )}
    </div>
  );
}
