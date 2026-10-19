"use client";
import { useEmpresas } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { SeloEmpresa } from "@/components/ui/Marca";
import { Selecao } from "@/components/ui/Selecao";

// Só a interface do filtro global. As telas NÃO usam este componente: usam o hook useFiltroEmpresa().
export function FiltroEmpresa() {
  const empresas = useEmpresas();
  const { selecionadas, trocar } = useFiltroEmpresa();
  return (
    <Selecao
      rotulo="Empresa"
      rotuloTodos="Todas"
      opcoes={empresas.map((e) => ({ valor: e.id, rotulo: e.nome, antes: <SeloEmpresa empresaId={e.id} nome={e.nome} tamanho={18} /> }))}
      valor={selecionadas}
      aoMudar={trocar}
    />
  );
}
