"use client";
import { useState, type CSSProperties, type DragEvent } from "react";
import { useEmpresas, type Tarefa } from "@/lib/dados";
import { NOMES } from "@/components/ficha/Ficha";
import { comMinuto, diaCurto, horaCurta, tituloPeriodo, variosDias, type Destino, type Visao } from "./logica";

export type Acoes = {
  abrir: (t: Tarefa) => void;
  criar: (destino: Destino) => void;
  soltar: (id: string, destino: Destino) => void;
  irPara: (visao: Visao, dia: string) => void;
};

function horario(t: Tarefa, longo: boolean) {
  if (!t.inicio || t.diaInteiro) return "";
  if (variosDias(t)) return `${horaCurta(t.inicio)} até ${diaCurto(t.fim!)}`;
  return longo && t.fim ? `${horaCurta(t.inicio)} às ${horaCurta(t.fim)}` : horaCurta(t.inicio);
}

/** Uma tarefa no calendário, na cor da etiqueta. "bloco" = grade de horários, "chip" = mês e dia inteiro, "cartao" = coluna Sem data.
    curto = bloco de até 45 min: tudo numa linha só. */
export function Evento({ t, modo, abrir, style, curto }: { t: Tarefa; modo: "bloco" | "chip" | "cartao"; abrir: (t: Tarefa) => void; style?: CSSProperties; curto?: boolean }) {
  const empresa = useEmpresas().find((e) => e.id === t.empresaId)?.nome ?? "Sem empresa";
  const pessoa = NOMES.responsavel[t.responsavel];
  const hora = horario(t, modo === "bloco");
  const tipo = NOMES.tipo[t.tipo];
  const etapa = t.etapa && NOMES.etapa[t.etapa];
  const detalhes = [t.rede && NOMES.rede[t.rede], etapa, modo === "cartao" && tipo !== etapa && tipo].filter(Boolean).join(" · ");
  return (
    <button
      type="button"
      draggable
      className={`evento evento-${modo}${curto ? " evento-curto" : ""}`}
      style={{ "--tarefa-fundo": `var(--${t.cor})`, "--tarefa-texto": `var(--${t.cor}-texto)`, ...style } as CSSProperties}
      title={`${t.titulo}\n${empresa} · ${pessoa}${hora ? ` · ${hora}` : ""}${detalhes ? `\n${detalhes}` : ""}`}
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", t.id); e.dataTransfer.effectAllowed = "move"; }}
      onClick={(e) => { e.stopPropagation(); abrir(t); }}
    >
      <span className="evento-linha">
        <span className={`evento-bolinha evento-bolinha-${t.responsavel}`} aria-label={pessoa}>{pessoa[0]}</span>
        {hora && (modo !== "bloco" || curto) && <span className="evento-hora">{curto ? hora.slice(0, 5) : hora}</span>}
        <span className="evento-titulo">{t.titulo}</span>
        {(modo === "chip" || curto) && <span className="selo">{empresa}</span>}
      </span>
      {modo !== "chip" && !curto && (
        <span className="evento-detalhes">
          <span className="selo">{empresa}</span>
          {modo === "bloco" && hora && <span>{hora}</span>}
          {detalhes && <span>{detalhes}</span>}
        </span>
      )}
    </button>
  );
}

/** Criar pelo teclado: o clique no vazio da grade não recebe foco, então cada dia (e cada coluna de horário) tem este
    botão, que só aparece quando o Tab chega nele. Na coluna de horário cria às 9h; a ficha deixa trocar. */
export function CriarAqui({ destino, criar, style }: { destino: NonNullable<Destino>; criar: Acoes["criar"]; style?: CSSProperties }) {
  const quando = destino.minuto !== undefined ? `, ${comMinuto(destino.dia, destino.minuto).slice(11)}` : destino.diaInteiro ? ", dia inteiro" : "";
  return (
    <button type="button" className="cal-criar" style={style} aria-label={`Nova tarefa: ${tituloPeriodo("dia", destino.dia)[0]}${quando}`} onClick={() => criar(destino)}>
      + Nova tarefa
    </button>
  );
}

/** Lugar onde se solta uma tarefa arrastada. `marcado` diz qual alvo está embaixo do mouse agora (para pintar). */
export function useSoltar(soltar: Acoes["soltar"]) {
  const [marcado, setMarcado] = useState<string | null>(null);
  const alvo = (chave: string, destino: Destino | ((e: DragEvent<HTMLElement>) => { chave: string; destino: Destino })) => ({
    onDragOver: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const c = typeof destino === "function" ? destino(e).chave : chave;
      if (c !== marcado) setMarcado(c);
    },
    onDragLeave: (e: DragEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMarcado(null);
    },
    onDrop: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      setMarcado(null);
      const id = e.dataTransfer.getData("text/plain");
      if (id) soltar(id, typeof destino === "function" ? destino(e).destino : destino);
    },
  });
  return { marcado, alvo };
}
