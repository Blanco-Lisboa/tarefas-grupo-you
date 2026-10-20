// ÚNICA porta de entrada dos dados. Telas importam daqui, nunca de ./exemplo ou ./repositorio.
"use client";
import { useSyncExternalStore } from "react";
import { assinar, lerEmpresas, lerErro, lerEu, lerTags, lerTarefas } from "./repositorio";

export * from "./tipos";
export { salvarTarefa, removerTarefa, salvarEmpresa, salvarTag, limparErro } from "./repositorio";

/** Todas as tarefas (reativo: re-renderiza quando alguma é criada, editada ou removida). */
export const useTarefas = () => useSyncExternalStore(assinar, lerTarefas, lerTarefas);
/** Todas as empresas cadastradas. */
export const useEmpresas = () => useSyncExternalStore(assinar, lerEmpresas, lerEmpresas);
/** Todas as tags (reativo). */
export const useTags = () => useSyncExternalStore(assinar, lerTags, lerTags);
/** Quem está logado (slug da pessoa), ou null enquanto carrega / se o login não está ligado a uma pessoa. */
export const useEu = () => useSyncExternalStore(assinar, lerEu, lerEu);
/** Último aviso de falha ao falar com o banco ("" = nenhum). */
export const useErroDados = () => useSyncExternalStore(assinar, lerErro, lerErro);
export * from "./pecas";
export * from "./ideias";
export * from "./pastas";
