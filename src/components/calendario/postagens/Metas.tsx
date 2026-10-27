"use client";
import { useId, useRef, type CSSProperties } from "react";
import { useEmpresas, type Ocorrencia } from "@/lib/dados";
import { NOMES } from "@/components/ficha/Ficha";
import { tomDaEmpresa } from "@/lib/cores-empresa";
import { SeloEmpresa } from "@/components/ui/Marca";
import { diaCurto, nomeSemana } from "../logica";
import { Marca } from "./Bloco";
import { estadoDoGrupo } from "./logica";

// Metas do dia (postagem sem hora) na faixa "Metas" da semana: UMA etiqueta por empresa, com logo e "feitas/total".
// Clicar abre a lista da empresa naquele dia: cada formato com o estado, o card que saiu (e a hora) e, para o Natham, editar.
const FALA = { planejada: "ainda não saiu", feita: "saiu", faltou: "faltou", extra: "extra" } as const;

type Props = {
  dia: string; metas: Ocorrencia[]; horaDoCard: (id: string) => string;
  abrir: (o: Ocorrencia) => ((o: Ocorrencia) => void) | undefined; verCard: (id: string) => void;
};

export function MetasDoDia({ dia, metas, ...resto }: Props) {
  const porEmpresa = new Map<string, Ocorrencia[]>();
  for (const o of metas) porEmpresa.set(o.empresaId, [...(porEmpresa.get(o.empresaId) ?? []), o]);
  return [...porEmpresa].map(([empresaId, lista]) => <Etiqueta key={empresaId} dia={dia} empresaId={empresaId} metas={lista} {...resto} />);
}

function Etiqueta({ dia, empresaId, metas, horaDoCard, abrir, verCard }: Omit<Props, "metas"> & { empresaId: string; metas: Ocorrencia[] }) {
  const id = useId().replace(/[^\w-]/g, "");
  const pop = useRef<HTMLDivElement>(null);
  const nome = useEmpresas().find((e) => e.id === empresaId)?.nome ?? empresaId;
  const feitas = metas.filter((o) => o.estado === "feita").length;
  const estado = estadoDoGrupo(metas);
  const fechar = () => pop.current?.hidePopover();
  return (
    <>
      <button type="button" className="pmeta-etiqueta" data-estado={estado} popoverTarget={`meta-${id}`}
        style={{ "--cor": tomDaEmpresa(empresaId).r, anchorName: `--meta-${id}` } as CSSProperties}
        aria-label={`Metas da ${nome}: ${feitas} de ${metas.length} saíram`} title={`Metas da ${nome}: ${feitas} de ${metas.length}`}>
        <SeloEmpresa empresaId={empresaId} nome={nome} tamanho={16} />
        <span>{feitas}/{metas.length}</span>
        <Marca estado={estado} />
      </button>
      <div ref={pop} id={`meta-${id}`} popover="auto" className="selecao-pop pmeta-pop" style={{ positionAnchor: `--meta-${id}` } as CSSProperties}>
        <div className="selecao-lista" role="group" aria-label={`Metas da ${nome}`}>
          <p className="pmeta-titulo"><SeloEmpresa empresaId={empresaId} nome={nome} tamanho={16} /> {nome} · {nomeSemana(dia).toLowerCase()}, {diaCurto(dia)}</p>
          {metas.map((o, i) => {
            const editar = abrir(o);
            const hora = o.cardId ? horaDoCard(o.cardId) : "";
            return (
              <div key={`${o.planejadaId}-${i}`} className="pmeta-linha" data-estado={o.estado}>
                <Marca estado={o.estado} />
                <b>{o.formato ? NOMES.formato[o.formato] : "Post"}</b>
                <span className="pmeta-fala">{o.estado === "feita" && hora ? `saiu às ${hora}` : FALA[o.estado]}</span>
                {o.cardId && <button type="button" className="pmeta-acao" onClick={() => { fechar(); verCard(o.cardId!); }}>Ver card</button>}
                {editar && <button type="button" className="pmeta-acao" onClick={() => { fechar(); editar(o); }}>Editar</button>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
