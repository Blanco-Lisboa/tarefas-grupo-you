"use client";
import { useEmpresas } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";

// Só a interface do filtro global. As telas NÃO usam este componente: usam o hook useFiltroEmpresa().
export function FiltroEmpresa() {
  const empresas = useEmpresas();
  const { todas, selecionadas, alternar, limpar } = useFiltroEmpresa();
  return (
    <div className="barra-filtro" role="group" aria-label="Filtro de empresa">
      <span className="barra-filtro-rotulo">Empresa</span>
      <button type="button" className="chip-empresa" aria-pressed={todas} onClick={limpar}>Todas</button>
      {empresas.map((e) => (
        <button
          key={e.id}
          type="button"
          className="chip-empresa"
          aria-pressed={selecionadas.includes(e.id)}
          onClick={() => alternar(e.id)}
        >
          {e.nome}
        </button>
      ))}
    </div>
  );
}
