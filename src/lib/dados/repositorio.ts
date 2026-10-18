// Repositório em memória (Fase 1). Na Fase 2 só ESTE arquivo troca por Supabase; a API pública (index.ts) fica igual.
import { empresasExemplo, tarefasExemplo } from "./exemplo";
import type { Empresa, NovaTarefa, Tarefa } from "./tipos";

let tarefas: Tarefa[] = tarefasExemplo;
let empresas: Empresa[] = empresasExemplo;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());

// Snapshots imutáveis: cada escrita troca o array (exigência do useSyncExternalStore).
export const lerTarefas = () => tarefas;
export const lerEmpresas = () => empresas;
export const assinar = (f: () => void) => (ouvintes.add(f), () => void ouvintes.delete(f));

export async function salvarTarefa(nova: NovaTarefa): Promise<Tarefa> {
  const tarefa = { ...nova, id: nova.id ?? crypto.randomUUID() } as Tarefa;
  tarefas = tarefas.some((t) => t.id === tarefa.id)
    ? tarefas.map((t) => (t.id === tarefa.id ? tarefa : t))
    : [...tarefas, tarefa];
  avisar();
  return tarefa;
}

export async function removerTarefa(id: string): Promise<void> {
  tarefas = tarefas.filter((t) => t.id !== id);
  avisar();
}

export async function salvarEmpresa(empresa: Empresa): Promise<Empresa> {
  empresas = empresas.some((e) => e.id === empresa.id)
    ? empresas.map((e) => (e.id === empresa.id ? empresa : e))
    : [...empresas, empresa];
  avisar();
  return empresa;
}

// ponytail: tirar uma empresa leva as tarefas dela junto. Na Fase 2 vira "arquivar" se o Natham preferir.
export async function removerEmpresa(id: string): Promise<void> {
  empresas = empresas.filter((e) => e.id !== id);
  tarefas = tarefas.filter((t) => t.empresaId !== id);
  avisar();
}
