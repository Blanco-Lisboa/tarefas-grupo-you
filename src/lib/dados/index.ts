// ÚNICA porta de entrada dos dados. Telas importam daqui, nunca de ./exemplo ou ./repositorio.
"use client";
import { useSyncExternalStore } from "react";
import { assinar, lerEmpresas, lerErro, lerEu, lerFazendo, lerTags, lerTarefas } from "./repositorio";

export * from "./tipos";
export { salvarTarefa, removerTarefa, salvarEmpresa, salvarTag, editarTag, excluirTag, limparErro, lerErro, comecar, parar, podeAlterar, podeApagar, postarAgora, tentarDeNovo } from "./repositorio";
export { postando } from "./postagens";

// Na hidratação vale o que o servidor desenhou: nada carregado. Se o 3º argumento lesse os dados vivos, a tela que hidrata depois
// de os dados chegarem (código atrasado, servidor recém-ligado) montava com eles e dava o erro React #418 (item 177, achado 4 do pedido).
const NADA: never[] = [];
const NINGUEM: ReturnType<typeof lerFazendo> = {};
const nada = () => NADA, ninguem = () => NINGUEM, nulo = () => null, vazio = () => "";

/** Todas as tarefas (reativo: re-renderiza quando alguma é criada, editada ou removida). */
export const useTarefas = () => useSyncExternalStore(assinar, lerTarefas, nada);
/** Todas as empresas cadastradas. */
export const useEmpresas = () => useSyncExternalStore(assinar, lerEmpresas, nada);
/** Todas as tags (reativo). */
export const useTags = () => useSyncExternalStore(assinar, lerTags, nada);
/** Quem está logado (slug da pessoa), ou null enquanto carrega / se o login não está ligado a uma pessoa. */
export const useEu = () => useSyncExternalStore(assinar, lerEu, nulo);
/** Quem está "fazendo agora" o quê: tarefaId -> {quem, desde}. Uma tarefa por pessoa, todos veem de todos. */
export const useFazendo = () => useSyncExternalStore(assinar, lerFazendo, ninguem);
/** Último aviso de falha ao falar com o banco ("" = nenhum). */
export const useErroDados = () => useSyncExternalStore(assinar, lerErro, vazio);
export * from "./ideias";
export * from "./agenda";
export * from "./anotacoes";
export * from "./agenda-feitos";
export * from "./drive";
export * from "./arvore";
