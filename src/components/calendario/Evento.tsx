"use client";
import { useState, type CSSProperties, type DragEvent } from "react";
import { useEmpresas, type Tarefa } from "@/lib/dados";
import { NOMES } from "@/components/ficha/Ficha";
import { tomDaEmpresa } from "@/lib/cores-empresa";
import { IconeRede, SeloEmpresa } from "@/components/ui/Marca";
import { Pessoa } from "@/components/ui/Pessoa";
import { ehReuniao } from "@/components/tarefas/grade";
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

/** Cor do bloco (item 78): o bloco inteiro no tom claro da MARCA da empresa (18% da cor sobre o branco; letra escura, AA)
    e a etapa numa etiqueta pequena. Tarefa sem empresa (ou de empresa apagada) fica no cinza neutro da ID Névoa. */
function cores(t: Tarefa, temEmpresa: boolean) {
  if (!temEmpresa) return { "--tarefa-fundo": "var(--fundo)", "--tarefa-texto": "var(--texto)" };
  return { "--tarefa-fundo": `color-mix(in srgb, ${tomDaEmpresa(t.empresaId).r} 18%, #fff)`, "--tarefa-texto": "var(--texto)" };
}

/** Uma tarefa no calendário. "bloco" = grade de horários, "chip" = mês e dia inteiro, "cartao" = coluna Sem data.
    curto = bloco de até 45 min: tudo numa linha só. */
export function Evento({ t, modo, abrir, style, curto }: { t: Tarefa; modo: "bloco" | "chip" | "cartao"; abrir: (t: Tarefa) => void; style?: CSSProperties; curto?: boolean }) {
  const dona = useEmpresas().find((e) => e.id === t.empresaId);
  const empresa = dona?.nome ?? "Sem empresa";
  const pessoa = NOMES.responsavel[t.responsavel];
  const hora = horario(t, modo === "bloco");
  const tipo = NOMES.tipo[t.tipo];
  const reuniao = ehReuniao(t);
  const etapa = !reuniao && t.etapa && NOMES.etapa[t.etapa]; // reunião não é conteúdo: sem etiqueta de etapa, só a cor das reuniões
  const detalhes = [t.rede && NOMES.rede[t.rede], modo === "cartao" && tipo !== etapa && tipo].filter(Boolean).join(" · ");
  const textoTipo = modo === "cartao" && tipo !== etapa ? tipo : "";
  // Sem empresa: sem selo (o fundo cinza já diz); a etiqueta "Sem empresa" comia o título dos blocos curtos
  const selo = dona && <span className="selo"><SeloEmpresa empresaId={t.empresaId} nome={empresa} tamanho={14} /></span>;
  const etiqueta = etapa && <span className={`etapa etapa-${t.etapa}`}>{etapa}</span>;
  return (
    <button
      type="button"
      draggable
      className={`evento evento-${modo}${curto ? " evento-curto" : ""}${reuniao ? " evento-reuniao" : ""}`}
      style={{ ...cores(t, !!dona), ...style } as CSSProperties}
      title={`${t.titulo}\n${empresa} · ${pessoa}${hora ? ` · ${hora}` : ""}${detalhes ? `\n${detalhes}` : ""}`}
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", t.id); e.dataTransfer.effectAllowed = "move"; }}
      onClick={(e) => { e.stopPropagation(); abrir(t); }}
    >
      <span className="evento-linha">
        <Pessoa quem={t.responsavel} tamanho={modo === "cartao" ? 20 : 16} />
        {hora && (modo !== "bloco" || curto) && <span className="evento-hora">{curto ? hora.slice(0, 5) : hora}</span>}
        <span className="evento-titulo">{t.titulo}</span>
        {modo === "chip" && <>{etiqueta}{selo}</>}
        {/* bloco curto: uma linha só; a etiqueta da etapa toma o lugar do selo (o fundo já diz a empresa) */}
        {curto && (etiqueta && dona ? etiqueta : selo)}
      </span>
      {modo !== "chip" && !curto && (
        <span className="evento-detalhes">
          {selo}
          {etiqueta}
          {modo === "bloco" && hora && <span>{hora}</span>}
          {t.rede && <IconeRede rede={t.rede} tamanho={13} />}
          {textoTipo && <span>{textoTipo}</span>}
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
