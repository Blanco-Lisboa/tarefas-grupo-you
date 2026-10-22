"use client";
// Envio de vídeo em segundo plano (item 268). A fila mora aqui, fora da ficha: fechar a ficha ou trocar de tela não interrompe o envio
// (só fechar a ABA interrompe; o aviso do canto pede confirmação). Analogia: o carteiro continua a rota mesmo depois de você sair da portaria.
// Para outras telas (ex.: vídeo legendado do item 270): `enviarEmSegundoPlano(tarefaId, arquivo, { papel, ordem })`; o card recebe o vídeo sozinho ao terminar.
import { useSyncExternalStore } from "react";
import { enviarParaDrive } from "./drive";
import { recarregarTarefas } from "./repositorio";
import { segurarPostagem } from "./subindo";

export type Envio = { id: string; nome: string; fracao: number; estado: "fila" | "enviando" | "enviado" | "falhou" | "interrompido"; erro?: string; tarefaId?: string };
type Entrada = { tarefaId: string; arquivo: File; papel: "anexo" | "capa"; ordem: number };

// Só o NOME e o card ficam guardados no navegador (nunca o arquivo): se a aba recarrega no meio do envio, o aviso volta como "interrompido" e manda escolher o vídeo de novo.
const GUARDA = "grade:envios-abertos";
const lerGuarda = (): Envio[] => {
  try { return (JSON.parse(localStorage.getItem(GUARDA) ?? "[]") as Envio[]).map((e) => ({ id: e.id, nome: e.nome, tarefaId: e.tarefaId, fracao: 0, estado: "interrompido" as const })); } catch { return []; }
};
let envios: Envio[] = typeof window === "undefined" ? [] : lerGuarda();
const guardar = () => { try { localStorage.setItem(GUARDA, JSON.stringify(envios.filter((e) => e.estado !== "enviado").map(({ id, nome, tarefaId }) => ({ id, nome, tarefaId })))); } catch { /* sem armazenamento: só não lembra */ } };
const entradas = new Map<string, Entrada>();
const ouvintes = new Set<() => void>();
let cauda: Promise<void> = Promise.resolve(); // um envio por vez: vários vídeos grandes juntos brigariam pela mesma internet
const SOME_EM_MS = 6000;

const avisar = () => { guardar(); ouvintes.forEach((f) => f()); };
const mudar = (id: string, p: Partial<Envio>) => { envios = envios.map((e) => (e.id === id ? { ...e, ...p } : e)); avisar(); };

async function rodar(id: string) {
  const e = entradas.get(id);
  if (!e) return;
  mudar(id, { estado: "enviando", fracao: 0, erro: undefined });
  try {
    await enviarParaDrive(e.tarefaId, e.arquivo, e.papel, e.ordem, (fracao) => mudar(id, { fracao }));
    entradas.delete(id);
    soltar(id);
    mudar(id, { estado: "enviado", fracao: 1 });
    void recarregarTarefas(); // o card passa a mostrar o vídeo
    setTimeout(() => { envios = envios.filter((x) => x.id !== id); avisar(); }, SOME_EM_MS);
  } catch (erro) {
    soltar(id); // falhou: a postagem do card não fica presa esperando
    mudar(id, { estado: "falhou", erro: erro instanceof Error ? erro.message : "O envio falhou." }); // a entrada fica: "tentar de novo" continua de onde parou
  }
}
const segurando = new Map<string, () => void>(); // achado 5: vídeo na fila ou subindo segura a postagem do card no banco
const soltar = (id: string) => { segurando.get(id)?.(); segurando.delete(id); };
const enfileirar = (id: string) => {
  const e = entradas.get(id);
  if (e && e.arquivo.type.startsWith("video/") && e.papel === "anexo" && !segurando.has(id)) segurando.set(id, segurarPostagem(e.tarefaId));
  cauda = cauda.then(() => rodar(id));
};

/** Põe o vídeo (ou qualquer arquivo) do card `tarefaId` na fila de envio ao Drive e devolve na hora. */
export function enviarEmSegundoPlano(tarefaId: string, arquivo: File, { papel = "anexo", ordem = 0 }: { papel?: "anexo" | "capa"; ordem?: number } = {}): string {
  const id = crypto.randomUUID();
  entradas.set(id, { tarefaId, arquivo, papel, ordem });
  envios = [...envios, { id, nome: arquivo.name, fracao: 0, estado: "fila", tarefaId }];
  avisar();
  enfileirar(id);
  return id;
}
/** "Falhou" + "Tentar de novo": volta para o fim da fila. */
export function tentarEnvioDeNovo(id: string) {
  if (!entradas.has(id)) return;
  mudar(id, { estado: "fila", fracao: 0, erro: undefined });
  enfileirar(id);
}
/** Tira o aviso de um envio que falhou e não será refeito. */
export function descartarEnvio(id: string) {
  soltar(id);
  entradas.delete(id);
  envios = envios.filter((e) => e.id !== id);
  avisar();
}

const SEM_ENVIOS: Envio[] = [];
/** Envios em segundo plano (reativo). */
export const useEnvios = () => useSyncExternalStore((f) => (ouvintes.add(f), () => void ouvintes.delete(f)), () => envios, () => SEM_ENVIOS);
