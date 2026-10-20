import type { Etapa } from "@/lib/dados";

/** Só o arraste manual para Postado pede confirmação. */
export const confirmarPostado = (origem: Etapa | undefined, destino: Etapa | null): boolean =>
  destino === "postado" && origem !== "postado";
