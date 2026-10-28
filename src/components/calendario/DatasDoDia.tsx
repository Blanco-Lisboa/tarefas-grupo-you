import { datasDoDia, type DataImportante } from "./datas";

const TIPO = { feriado: "Feriado", comemorativa: "Data comemorativa" };
/** Texto do title: uma linha por data, com o aviso (ponto facultativo, prazo antecipado, campanha do mês). */
export const textoDatas = (lista: DataImportante[]) => lista.map((d) => `${TIPO[d.tipo]}: ${d.nome}${d.aviso ? `. ${d.aviso}` : ""}`).join("\n");

/** Etiqueta do feriado ou data comemorativa no topo do dia (Dia, Semana e Mês). Mais de uma data: a primeira e "+N". */
export function DatasDoDia({ dia }: { dia: string }) {
  const lista = datasDoDia(dia);
  if (!lista.length) return null;
  return (
    <span className="data-imp" data-tipo={lista[0].tipo} title={textoDatas(lista)}>
      <span className="data-imp-nome">{lista[0].nome}</span>
      {lista.length > 1 && <span className="data-imp-mais">+{lista.length - 1}</span>}
    </span>
  );
}
