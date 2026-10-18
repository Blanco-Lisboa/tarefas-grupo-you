// ÚNICA porta de entrada dos dados. Telas importam daqui, nunca de ./exemplo ou ./repositorio.
"use client";
import { useSyncExternalStore } from "react";
import { assinar, lerEmpresas, lerTarefas } from "./repositorio";

export * from "./tipos";
export { salvarTarefa, removerTarefa, salvarEmpresa, removerEmpresa } from "./repositorio";

/** Todas as tarefas (reativo: re-renderiza quando alguma é criada, editada ou removida). */
export const useTarefas = () => useSyncExternalStore(assinar, lerTarefas, lerTarefas);
/** Todas as empresas cadastradas. */
export const useEmpresas = () => useSyncExternalStore(assinar, lerEmpresas, lerEmpresas);
