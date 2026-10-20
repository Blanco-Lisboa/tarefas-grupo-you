// Anexos do card (item 129 + 203). Card COM empresa: tudo (imagem, vídeo, documento) vai direto do navegador ao Drive (drive.ts).
// Card SEM empresa: fica no Supabase como antes, mas vídeo não entra (vídeo nunca mora no Supabase).
import { Upload } from "tus-js-client";
import { supabase } from "@/lib/supabase/cliente";
import { apagarAnexoDrive, enviarParaDrive, ordenarAnexosDrive, recarregarOcasioes, registrarProgresso } from "./drive";
import type { Tarefa } from "./tipos";

type Arquivos = Tarefa["arquivos"];
type LinhaArquivo = { id: string; tarefa_id: string; caminho: string | null; drive_id?: string | null; ordem?: number; papel?: "anexo" | "capa"; nome: string; tipo: NonNullable<Arquivos[number]["tipo"]>; drive_link?: string | null; removido_em?: string | null; aviso?: string | null };
type Cliente = ReturnType<typeof supabase>;
const BALDE = "arquivos";
const ATE_6_MB = 6 * 1024 * 1024;

/** Erro com mensagem já em português para a tela mostrar. */
export class ErroAnexo extends Error {}

/** Até 6 MB sobe de uma vez; acima disso, envio em partes de 6 MB (TUS) que aguenta arquivo grande e retoma se a rede cair. */
async function subir(sb: Cliente, caminho: string, f: File) {
  if (f.size <= ATE_6_MB) {
    const { error } = await sb.storage.from(BALDE).upload(caminho, f, { contentType: f.type });
    if (error) throw error;
    return;
  }
  const { data } = await sb.auth.getSession();
  await new Promise<void>((ok, nao) => new Upload(f, {
    endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(".supabase.co", ".storage.supabase.co")}/storage/v1/upload/resumable`,
    headers: { authorization: `Bearer ${data.session?.access_token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
    retryDelays: [0, 3000, 5000, 10000],
    chunkSize: ATE_6_MB,
    uploadDataDuringCreation: true,
    removeFingerprintOnSuccess: true,
    metadata: { bucketName: BALDE, objectName: caminho, contentType: f.type, cacheControl: "3600" },
    onError: nao,
    onSuccess: () => ok(),
  }).start());
}

/** Anexos de todas as tarefas. Supabase: endereço assinado (balde privado, 1 hora). Drive: sem endereço; abre no player do Drive pelo `driveId`. */
export async function carregarAnexos(sb: Cliente): Promise<Map<string, Arquivos>> {
  const porTarefa = new Map<string, Arquivos>();
  const { data, error } = await sb.from("arquivos").select("*").not("tarefa_id", "is", null).order("ordem").order("created_at");
  if (error || !data?.length) return porTarefa;
  const linhas = data as LinhaArquivo[];
  const guardados = linhas.filter((a) => a.caminho && !a.removido_em).map((a) => a.caminho!);
  const { data: urls } = guardados.length ? await sb.storage.from(BALDE).createSignedUrls(guardados, 3600) : { data: [] };
  const url = new Map(urls?.map((u) => [u.path, u.signedUrl]));
  for (const a of linhas) {
    const base = { id: a.id, nome: a.nome, tipo: a.tipo, ordem: a.ordem ?? 0, papel: a.papel ?? "anexo", aviso: a.aviso ?? undefined, driveLink: a.drive_link ?? undefined };
    const arq: Arquivos[number] = a.drive_id ? { ...base, driveId: a.drive_id }
      : a.removido_em ? { ...base, caminho: a.caminho ?? undefined, removido: true }
      : { ...base, caminho: a.caminho ?? undefined, url: (a.caminho ? url.get(a.caminho) : undefined) ?? undefined };
    porTarefa.set(a.tarefa_id, [...(porTarefa.get(a.tarefa_id) ?? []), arq]);
  }
  return porTarefa;
}

const chaveDe = (a: Arquivos[number]) => a.id ?? a.caminho ?? a.driveId;

/** Deixa Drive, Storage e tabela iguais ao que a ficha mostra: apaga o que saiu, sobe o que é novo, guarda a ordem do carrossel. Devolve a lista já com id e endereço. */
export async function sincronizarAnexos(sb: Cliente, tarefaId: string, empresaId: string, pessoa: string | undefined, antes: Arquivos, agora: Arquivos, aoProgredir?: (nome: string, fracao: number) => void): Promise<Arquivos> {
  const ficam = new Set(agora.map(chaveDe));
  const saiu = antes.filter((a) => !ficam.has(chaveDe(a)));
  const saiuSupabase = saiu.flatMap((a) => (a.caminho && !a.driveId ? [a.caminho] : []));
  for (const a of saiu) if (a.driveId && a.id) await apagarAnexoDrive(a.id); // lixeira do Google + linha
  if (saiuSupabase.length) {
    const { error: erroObjeto } = await sb.storage.from(BALDE).remove(saiuSupabase); // objeto primeiro: se falhar, a linha fica e dá para tentar de novo
    if (erroObjeto) throw erroObjeto;
    const { error } = await sb.from("arquivos").delete().in("caminho", saiuSupabase);
    if (error) throw error;
  }
  const guardados: Arquivos = [];
  for (const [i, a] of agora.entries()) {
    if (!a.pendente) { guardados.push(a); continue; }
    if (empresaId) {
      const novo = { ...(await enviarParaDrive(tarefaId, a.pendente, a.papel ?? "anexo", i, (f) => { registrarProgresso(a.url, f); aoProgredir?.(a.nome, f); })), url: a.url }; // url local (blob:) vale até recarregar
      Object.assign(a, novo, { pendente: undefined }); // já está no Drive: se um anexo seguinte falhar, salvar de novo não manda este outra vez
      guardados.push(novo);
      continue;
    }
    if (a.tipo === "video") throw new ErroAnexo("Escolha a empresa para anexar vídeo.");
    const caminho = `tarefas/${tarefaId}/${crypto.randomUUID()}-${a.nome.replace(/[^\w.-]+/g, "_")}`;
    await subir(sb, caminho, a.pendente);
    const { error: e2 } = await sb.from("arquivos").insert({ tarefa_id: tarefaId, caminho, nome: a.nome, tipo: a.tipo, tamanho: a.pendente.size, criado_por: pessoa });
    if (e2) { await sb.storage.from(BALDE).remove([caminho]); throw e2; }
    const { data } = await sb.storage.from(BALDE).createSignedUrl(caminho, 3600);
    guardados.push({ nome: a.nome, tipo: a.tipo, caminho, url: data?.signedUrl ?? undefined });
  }
  // ordem do carrossel: só os do Drive que já existiam e mudaram de lugar
  const mudou = guardados.flatMap((a, i) => (a.driveId && a.id && (antes.find((x) => x.id === a.id)?.ordem ?? i) !== i ? [{ id: a.id, ordem: i }] : []));
  if (mudou.length) await ordenarAnexosDrive(tarefaId, mudou);
  if (agora.some((a) => a.pendente) && empresaId) void recarregarOcasioes(); // o servidor pode ter criado a ocasião do card
  return guardados.map((a, i) => (a.driveId ? { ...a, ordem: i } : a));
}
