// ÚNICA porta de entrada dos dados. Telas importam daqui, nunca de ./exemplo ou ./repositorio.
"use client";
import { useSyncExternalStore } from "react";
import { assinar, lerEmpresas, lerTags, lerTarefas } from "./repositorio";

export * from "./tipos";
export { salvarTarefa, removerTarefa, salvarEmpresa, removerEmpresa, salvarTag } from "./repositorio";

/** Todas as tarefas (reativo: re-renderiza quando alguma é criada, editada ou removida). */
export const useTarefas = () => useSyncExternalStore(assinar, lerTarefas, lerTarefas);
/** Todas as empresas cadastradas. */
export const useEmpresas = () => useSyncExternalStore(assinar, lerEmpresas, lerEmpresas);
/** Todas as tags (reativo). */
export const useTags = () => useSyncExternalStore(assinar, lerTags, lerTags);
export * from "./pecas";
export * from "./ideias";
