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
  if (!r.ok) throw new ErroServidor(j.erro ?? "Não consegui falar com o Drive. Tente de novo.", r.status);
  return j as T;
}
/** Resposta de erro da função `drive`, com o código HTTP (a anotação do envio depende dele). */
export class ErroServidor extends Error {
  constructor(mensagem: string, public status: number) {
    super(mensagem);
  }
}

export const tipoDe = (f: { type: string }): NonNullable<Arquivo["tipo"]> => (f.type.startsWith("video/") ? "video" : f.type.startsWith("image/") ? "imagem" : "documento");

/** O que o Drive respondeu a uma parte: acabou (com o id), ou até onde já recebeu. */
type Retorno = { id: string } | { recebido: number };
async function lerRetorno(r: Response): Promise<Retorno> {
  if (r.status === 200 || r.status === 201) return { id: ((await r.json()) as { id: string }).id };
  const faixa = /bytes=0-(\d+)/.exec(r.headers.get("range") ?? ""); // sem Range = nada recebido ainda
  return { recebido: faixa ? Number(faixa[1]) + 1 : 0 };
}
/** Pergunta ao Drive até onde a sessão já recebeu (depois de uma parte que falhou). Se o último pedaço já tinha chegado, devolve o id. */
async function ondeParou(sessao: string, total: number, buscar: typeof fetch): Promise<Retorno> {
  const r = await buscar(sessao, { method: "PUT", headers: { "content-range": `bytes */${total}` } });
  if (r.status !== 200 && r.status !== 201 && r.status !== 308) throw new Error(`Drive ${r.status}`);
  return lerRetorno(r);
}

/** Manda o arquivo em partes de 8 MB para o endereço da sessão; refaz a parte que falhou (até 3 vezes) e segue o Range que o Drive devolve. Devolve o id do arquivo no Drive. */
export async function enviarEmPartes(sessao: string, arquivo: Blob, aoProgredir?: (fracao: number) => void, buscar: typeof fetch = (...a) => fetch(...a), parte = PARTE, desde = 0): Promise<string> {
  const total = arquivo.size;
  let inicio = desde, falhas = 0;
  while (inicio < total) {
    const fim = Math.min(inicio + parte, total);
    try {
      const r = await buscar(sessao, { method: "PUT", headers: { "content-range": `bytes ${inicio}-${fim - 1}/${total}` }, body: arquivo.slice(inicio, fim) });
      if (r.status !== 200 && r.status !== 201 && r.status !== 308) throw new Error(`Drive ${r.status}`);
      const ret = await lerRetorno(r);
      if ("id" in ret) { aoProgredir?.(1); return ret.id; }
      inicio = ret.recebido; // o que o Drive diz que tem, não o que achamos que mandamos
      falhas = 0;
      aoProgredir?.(inicio / total);
    } catch (e) {
      if (++falhas >= TENTATIVAS) throw new Error("O envio para o Drive falhou. Tente de novo.", { cause: e });
      try {
        const ret = await ondeParou(sessao, total, buscar);
        if ("id" in ret) { aoProgredir?.(1); return ret.id; }
        inicio = ret.recebido;
      } catch { /* sem resposta: tenta a mesma parte de novo */ }
    }
  }
  throw new Error("O Drive não confirmou o envio. Tente de novo.");
}

// Anotação do envio em andamento (por card, papel, nome, tamanho e data do arquivo): se a conexão cair depois de o arquivo chegar ao Drive e antes
// de o servidor registrá-lo, a nova tentativa continua a MESMA sessão e confirma o MESMO arquivo, em vez de subir outro e deixar o primeiro solto.
type Anotacao = { sessao: string; driveId?: string };
const chaveEnvio = (tarefaId: string, a: File, papel: string) => `grade:envio:${tarefaId}:${papel}:${a.name}:${a.size}:${a.lastModified}`;
function anotacao(chave: string, nova?: Anotacao | null): Anotacao | undefined {
  try {
    if (nova === null) localStorage.removeItem(chave);
    else if (nova) localStorage.setItem(chave, JSON.stringify(nova));
    else return JSON.parse(localStorage.getItem(chave) ?? "null") ?? undefined;
  } catch { /* sem armazenamento: funciona como antes, sem retomar */ }
}

/** Anexa um arquivo ao card: abre a sessão, sobe direto ao Drive e registra. Devolve o arquivo já no formato da ficha. */
export async function enviarParaDrive(tarefaId: string, arquivo: File, papel: "anexo" | "capa", ordem: number, aoProgredir?: (fracao: number) => void): Promise<Arquivo> {
  const tipo = tipoDe(arquivo), mime = arquivo.type || "application/octet-stream";
  const chave = chaveEnvio(tarefaId, arquivo, papel);
  let nota = anotacao(chave);
  let driveId = nota?.driveId; // já chegou ao Drive numa tentativa anterior: só falta confirmar
  if (!driveId && nota) {
    try { // sessão aberta antes: pergunta até onde chegou e continua dali
      const ret = await ondeParou(nota.sessao, arquivo.size, (...a) => fetch(...a));
      driveId = "id" in ret ? ret.id : await enviarEmPartes(nota.sessao, arquivo, aoProgredir, undefined, undefined, ret.recebido);
    } catch { nota = undefined; anotacao(chave, null); } // sessão vencida ou perdida: começa uma nova
  }
  if (!driveId) {
    const { sessao_url } = await chamar<{ sessao_url: string }>({ acao: "sessao_envio", tarefa_id: tarefaId, nome: arquivo.name, tipo, mime, tamanho: arquivo.size, papel });
    anotacao(chave, { sessao: sessao_url });
    driveId = await enviarEmPartes(sessao_url, arquivo, aoProgredir);
  }
  anotacao(chave, { sessao: nota?.sessao ?? "", driveId });
  let arquivo_id: string;
  try {
    ({ arquivo_id } = await chamar<{ arquivo_id: string }>({ acao: "confirmar_envio", tarefa_id: tarefaId, drive_id: driveId, nome: arquivo.name, tipo, tamanho: arquivo.size, papel, ordem }));
  } catch (e) {
    // O arquivo continua no Drive: a anotação fica e a próxima tentativa só confirma. Só se descarta quando o servidor diz que o arquivo não serve mais
    // (não existe, lixeira, pasta errada ou tamanho errado: 410/422); aí o próximo envio é novo e não deixa o antigo solto.
    if (e instanceof ErroServidor && (e.status === 410 || e.status === 422)) { anotacao(chave, null); throw e; }
    throw new Error("Não deu para confirmar o envio, tente de novo.", { cause: e });
  }
  anotacao(chave, null);
  return { id: arquivo_id, nome: arquivo.name, tipo, driveId, ordem, papel };
}

/** Guarda a ordem do carrossel (só os anexos do Drive que mudaram de lugar). */
export const ordenarAnexosDrive = (tarefaId: string, ordem: { id: string; ordem: number }[]) => chamar({ acao: "ordenar_anexos", tarefa_id: tarefaId, ordem }).then(() => undefined);

/** Endereço assinado de 10 min que serve o vídeo do Drive por pedaços (Range), para a barrinha de escolher o quadro da capa. */
export async function linkDeVideo(arquivoId: string): Promise<string> {
  return (await chamar<{ url: string }>({ acao: "link_video", arquivo_id: arquivoId })).url;
}
/** Tira um anexo do Drive (vai para a lixeira do Google) e apaga a linha. */
export const apagarAnexoDrive = (arquivoId: string) => chamar({ acao: "apagar_anexo", arquivo_id: arquivoId }).then(() => undefined);
/** Apaga o card COM os arquivos dele (Drive e Supabase). Lança Error com a mensagem da tela se falhar; nada some pela metade. */
export const apagarTarefaComArquivos = (tarefaId: string) => chamar({ acao: "apagar_tarefa", tarefa_id: tarefaId }).then(() => undefined);

// ---- Progresso do envio (a barra do Anexos): chave = endereço local (blob:) do arquivo que está subindo ----
let progresso: Record<string, number> = {};
const ouvintesProgresso = new Set<() => void>();
export function registrarProgresso(chave: string | undefined, fracao: number) {
  if (!chave) return;
  const { [chave]: _antigo, ...resto } = progresso;
  void _antigo;
  progresso = fracao >= 1 ? resto : { ...resto, [chave]: fracao };
  ouvintesProgresso.forEach((f) => f());
}
const SEM_PROGRESSO: Record<string, number> = {};
/** Fração (0 a 1) de cada arquivo que está subindo ao Drive agora. */
export const useProgressoEnvio = () => useSyncExternalStore((f) => (ouvintesProgresso.add(f), () => void ouvintesProgresso.delete(f)), () => progresso, () => SEM_PROGRESSO);

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
