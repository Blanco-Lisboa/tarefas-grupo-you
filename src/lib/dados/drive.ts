// Google Drive no navegador (item 203): o arquivo sobe DIRETO do navegador para o Drive (nunca passa pelo Supabase);
// a função `drive` do servidor só abre a sessão de envio, confere e registra. Vídeo nunca é recomprimido.
import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase/cliente";
import type { Arquivo } from "./tipos";

const PARTE = 8 * 1024 * 1024; // múltiplo de 256 KB, como o Drive exige
const TENTATIVAS = 3;

const base = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
async function cabecalho() {
  const { data } = await supabase().auth.getSession();
  return { authorization: `Bearer ${data.session?.access_token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, "content-type": "application/json" };
}
/** Chama a função `drive`; em falha lança Error com a mensagem já em português para a tela. */
async function chamar<T>(corpo: Record<string, unknown>): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${base()}/functions/v1/drive`, { method: "POST", headers: await cabecalho(), body: JSON.stringify(corpo) });
  } catch {
    throw new Error("Sem conexão com o servidor. Tente de novo.");
  }
  const j = (await r.json().catch(() => ({}))) as { erro?: string };
  if (!r.ok) throw new Error(j.erro ?? "Não consegui falar com o Drive. Tente de novo.");
  return j as T;
}

export const tipoDe = (f: { type: string }): NonNullable<Arquivo["tipo"]> => (f.type.startsWith("video/") ? "video" : f.type.startsWith("image/") ? "imagem" : "documento");

/** Pergunta ao Drive até onde a sessão já recebeu (depois de uma parte que falhou). */
async function ondeParou(sessao: string, total: number, buscar: typeof fetch): Promise<number> {
  const r = await buscar(sessao, { method: "PUT", headers: { "content-range": `bytes */${total}` } });
  if (r.status === 200 || r.status === 201) return total;
  const faixa = /bytes=0-(\d+)/.exec(r.headers.get("range") ?? "");
  return faixa ? Number(faixa[1]) + 1 : 0;
}

/** Manda o arquivo em partes de 8 MB para o endereço da sessão; refaz a parte que falhou (até 3 vezes). Devolve o id do arquivo no Drive. */
export async function enviarEmPartes(sessao: string, arquivo: Blob, aoProgredir?: (fracao: number) => void, buscar: typeof fetch = (...a) => fetch(...a), parte = PARTE): Promise<string> {
  const total = arquivo.size;
  let inicio = 0, falhas = 0;
  while (inicio < total) {
    const fim = Math.min(inicio + parte, total);
    try {
      const r = await buscar(sessao, { method: "PUT", headers: { "content-range": `bytes ${inicio}-${fim - 1}/${total}` }, body: arquivo.slice(inicio, fim) });
      if (r.status === 200 || r.status === 201) {
        aoProgredir?.(1);
        return ((await r.json()) as { id: string }).id;
      }
      if (r.status !== 308) throw new Error(`Drive ${r.status}`);
      inicio = fim;
      falhas = 0;
      aoProgredir?.(inicio / total);
    } catch (e) {
      if (++falhas >= TENTATIVAS) throw new Error("O envio para o Drive falhou. Tente de novo.", { cause: e });
      inicio = await ondeParou(sessao, total, buscar).catch(() => inicio);
    }
  }
  throw new Error("O Drive não confirmou o envio. Tente de novo.");
}

/** Anexa um arquivo ao card: abre a sessão, sobe direto ao Drive e registra. Devolve o arquivo já no formato da ficha. */
export async function enviarParaDrive(tarefaId: string, arquivo: File, papel: "anexo" | "capa", ordem: number, aoProgredir?: (fracao: number) => void): Promise<Arquivo> {
  const tipo = tipoDe(arquivo), mime = arquivo.type || "application/octet-stream";
  const { sessao_url } = await chamar<{ sessao_url: string }>({ acao: "sessao_envio", tarefa_id: tarefaId, nome: arquivo.name, tipo, mime, tamanho: arquivo.size, papel });
  const driveId = await enviarEmPartes(sessao_url, arquivo, aoProgredir);
  const { arquivo_id } = await chamar<{ arquivo_id: string }>({ acao: "confirmar_envio", tarefa_id: tarefaId, drive_id: driveId, nome: arquivo.name, tipo, tamanho: arquivo.size, papel, ordem });
  return { id: arquivo_id, nome: arquivo.name, tipo, driveId, ordem, papel };
}

/** Endereço assinado de 10 min que serve o vídeo do Drive por pedaços (Range), para a barrinha de escolher o quadro da capa. */
export async function linkDeVideo(arquivoId: string): Promise<string> {
  return (await chamar<{ url: string }>({ acao: "link_video", arquivo_id: arquivoId })).url;
}
/** Tira um anexo do Drive (vai para a lixeira do Google) e apaga a linha. */
export const apagarAnexoDrive = (arquivoId: string) => chamar({ acao: "apagar_anexo", arquivo_id: arquivoId }).then(() => undefined);
/** Apaga o card COM os arquivos dele (Drive e Supabase). Lança Error com a mensagem da tela se falhar; nada some pela metade. */
export const apagarTarefaComArquivos = (tarefaId: string) => chamar({ acao: "apagar_tarefa", tarefa_id: tarefaId }).then(() => undefined);

// ---- Ocasiões (pasta do Drive dentro da empresa) ----
export type Ocasiao = { id: string; empresaId: string; nome: string };
let ocasioes: Ocasiao[] = [];
let carregou = false;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());
async function carregarOcasioes() {
  const { data, error } = await supabase().from("ocasioes").select("id, empresa_id, nome").order("nome");
  if (error || !data) return;
  ocasioes = data.map((o) => ({ id: o.id as string, empresaId: o.empresa_id as string, nome: o.nome as string }));
  avisar();
}
const assinar = (f: () => void) => {
  ouvintes.add(f);
  if (!carregou && typeof window !== "undefined") { carregou = true; void carregarOcasioes(); }
  return () => void ouvintes.delete(f);
};
const NADA: Ocasiao[] = [];
/** Ocasiões de todas as empresas (reativo). */
export const useOcasioes = () => useSyncExternalStore(assinar, () => ocasioes, () => NADA);

export async function criarOcasiao(empresaId: string, nome: string): Promise<Ocasiao> {
  const { ocasiao } = await chamar<{ ocasiao: { id: string; empresa_id: string; nome: string } }>({ acao: "criar_ocasiao", empresa_id: empresaId, nome });
  const nova = { id: ocasiao.id, empresaId: ocasiao.empresa_id, nome: ocasiao.nome };
  ocasioes = [...ocasioes, nova];
  avisar();
  return nova;
}
export async function renomearOcasiao(id: string, nome: string): Promise<void> {
  await chamar({ acao: "renomear_ocasiao", ocasiao_id: id, nome });
  ocasioes = ocasioes.map((o) => (o.id === id ? { ...o, nome: nome.trim() } : o));
  avisar();
}
/** Ocasião nova criada pelo servidor ao anexar (card sem ocasião): recarrega a lista. */
export const recarregarOcasioes = () => carregarOcasioes();

// ---- Google Drive ligado? (Configurações, só o Natham) ----
async function autorizar<T>(consulta: string): Promise<T> {
  const r = await fetch(`${base()}/functions/v1/google-autorizar?${consulta}`, { headers: await cabecalho() });
  const j = (await r.json().catch(() => ({}))) as { erro?: string };
  if (!r.ok) throw new Error(j.erro ?? "Não consegui falar com o servidor.");
  return j as T;
}
export const estadoGoogleDrive = () => autorizar<{ ligado: boolean; email?: string }>("status=1");
/** Devolve o endereço do Google onde o Natham aceita; a tela navega até ele. */
export const enderecoLigarGoogle = async () => (await autorizar<{ url: string }>("inicio=1")).url;
