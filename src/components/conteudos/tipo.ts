import type { Etapa, TipoTarefa } from "@/lib/dados";

/** As três últimas colunas acompanham uma postagem, não criam um novo tipo de tarefa. */
export const tipoDaColuna = (etapa: Etapa): TipoTarefa =>
  etapa === "roteiro" || etapa === "gravacao" || etapa === "edicao" ? etapa : "postagem";

