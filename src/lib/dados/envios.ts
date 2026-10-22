"use client";
// Envio de vídeo em segundo plano (item 268). A fila mora aqui, fora da ficha: fechar a ficha ou trocar de tela não interrompe o envio
// (só fechar a ABA interrompe; o aviso do canto pede confirmação). Analogia: o carteiro continua a rota mesmo depois de você sair da portaria.
// Para outras telas (ex.: vídeo legendado do item 270): `enviarEmSegundoPlano(tarefaId, arquivo, { papel, ordem })`; o card recebe o vídeo sozinho ao terminar.
import { useSyncExternalStore } from "react";
import { enviarParaDrive } from "./drive";
import { recarregarTarefas } from "./repositorio";

export type Envio = { id: string; nome: string; fracao: number; estado: "fila" | "enviando" | "enviado" | "falhou"; erro?: string };
type Entrada = { tarefaId: string; arquivo: File; papel: "anexo" | "capa"; ordem: number };

let envios: Envio[] = [];
const entradas = new Map<string, Entrada>();
const ouvintes = new Set<() => void>();
let cauda: Promise<void> = Promise.resolve(); // um envio por vez: vários vídeos grandes juntos brigariam pela mesma internet
const SOME_EM_MS = 6000;

const avisar = () => ouvintes.forEach((f) => f());
const mudar = (id: string, p: Partial<Envio>) => { envios = envios.map((e) => (e.id === id ? { ...e, ...p } : e)); avisar(); };

async function rodar(id: string) {
  const e = entradas.get(id);
  if (!e) return;
  mudar(id, { estado: "enviando", fracao: 0, erro: undefined });
  try {
    await enviarParaDrive(e.tarefaId, e.arquivo, e.papel, e.ordem, (fracao) => mudar(id, { fracao }));
    entradas.delete(id);
    mudar(id, { estado: "enviado", fracao: 1 });
    void recarregarTarefas(); // o card passa a mostrar o vídeo
    setTimeout(() => { envios = envios.filter((x) => x.id !== id); avisar(); }, SOME_EM_MS);
  } catch (erro) {
    mudar(id, { estado: "falhou", erro: erro instanceof Error ? erro.message : "O envio falhou." }); // a entrada fica: "tentar de novo" continua de onde parou
  }
}
const enfileirar = (id: string) => { cauda = cauda.then(() => rodar(id)); };

/** Põe o vídeo (ou qualquer arquivo) do card `tarefaId` na fila de envio ao Drive e devolve na hora. */
export function enviarEmSegundoPlano(tarefaId: string, arquivo: File, { papel = "anexo", ordem = 0 }: { papel?: "anexo" | "capa"; ordem?: number } = {}): string {
  const id = crypto.randomUUID();
  entradas.set(id, { tarefaId, arquivo, papel, ordem });
  envios = [...envios, { id, nome: arquivo.name, fracao: 0, estado: "fila" }];
  avisar();
  enfileirar(id);
  return id;
}
/** "Falhou — tentar de novo": volta para o fim da fila. */
export function tentarEnvioDeNovo(id: string) {
  if (!entradas.has(id)) return;
  mudar(id, { estado: "fila", fracao: 0, erro: undefined });
  enfileirar(id);
}
/** Tira o aviso de um envio que falhou e não será refeito. */
export function descartarEnvio(id: string) {
  entradas.delete(id);
  envios = envios.filter((e) => e.id !== id);
  avisar();
}

const SEM_ENVIOS: Envio[] = [];
/** Envios em segundo plano (reativo). */
export const useEnvios = () => useSyncExternalStore((f) => (ouvintes.add(f), () => void ouvintes.delete(f)), () => envios, () => SEM_ENVIOS);
