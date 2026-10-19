// Anotação solta do dia: fica só neste navegador. A nota mostrada segue SEMPRE a chave do dia aberto.
export type Armazem = Pick<Storage, "getItem" | "setItem">;
export type EstadoNota = { chave: string; valor: string };

export const lerNota = (chave: string, armazem: Armazem): string => {
  try { return armazem.getItem(chave) ?? ""; } catch { return ""; }
};

/** O estado vale só para a chave em que foi escrito; outra chave (outro dia) lê a nota dela do armazém. */
export const notaDaChave = (atual: EstadoNota | null, chave: string, armazem: Armazem): EstadoNota =>
  atual && atual.chave === chave ? atual : { chave, valor: lerNota(chave, armazem) };
