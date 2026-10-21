// Pasta livre (item 234): a "+ Nova pasta" da tela Pastas. Mora na empresa, ao lado das pastas de formato: Tarefas · Conteúdos → Empresa → <nome>.
// NÃO é Tema. Natham e Matheus sobem e apagam arquivos nela; nada sai sozinho. Permanente (cadeado) = a pasta não se apaga (renomear pode); só o Natham desliga.
// As regras de quem pode são do BANCO (definir_permanente_livre, pode_apagar_pasta_livre, gatilho do cadeado); esta função só pergunta e obedece.
import { chaves, nomeReservado } from "../_shared/pastas.ts";
import { MAX_BYTES, nomeOk, Recusa, texto, TIPOS } from "./comum.ts";
import { ErroDrive, type DriveApi } from "./drive-api.ts";
import { ErroRest, type Rest } from "./rest.ts";

type Pasta = { id: string; empresa_id: string; nome: string; permanente: boolean };
type Contexto = { eu: Rest; pessoaId: string; origem: string };
const SEM_CADEADO = "Só o Natham desliga o Permanente.";
const COM_CADEADO = "Esta pasta tem cadeado. Desligue o Permanente para apagar.";

export function criarPastaLivre(d: { api: DriveApi }, servico: () => Rest, pastaEmpresa: (empresaId: string) => Promise<string>) {
  const exigirPessoa = async (eu: Rest) => { if ((await eu.rpc("pode_mexer_pastas")) !== true) throw new Recusa(403, "Você não pode mexer nas pastas."); };
  async function pastaDe(id: string | undefined): Promise<Pasta> {
    if (!id) throw new Recusa(400, "Pasta não informada.");
    const [p] = await servico().ler<Pasta>("pastas_livres", { id });
    if (!p) throw new Recusa(404, "Pasta não encontrada.");
    return p;
  }
  const linha = (p: Pasta) => ({ id: p.id, empresa_id: p.empresa_id, nome: p.nome, permanente: p.permanente === true });
  async function nomeLivre(empresa: string, nome: string, ignorar?: string) {
    if (nomeReservado(nome)) throw new Recusa(409, "Esse nome já é de uma pasta de formato.");
    if ((await servico().ler<Pasta>("pastas_livres", { empresa_id: empresa })).some((x) => x.id !== ignorar && x.nome.trim().toLowerCase() === nome.toLowerCase())) throw new Recusa(409, "Já existe uma pasta com esse nome.");
  }
  /** A pasta no Drive (cria se a chave se perdeu). */
  async function driveDa(p: Pasta): Promise<string> {
    const s = servico(), chave = chaves.livre(p.id);
    const [x] = await s.ler<{ drive_id: string }>("drive_pastas", { chave }, "drive_id");
    if (x) return x.drive_id;
    const id = await d.api.criarPasta(p.nome, await pastaEmpresa(p.empresa_id));
    if ((await s.inserir("drive_pastas", { chave, drive_id: id }, "chave")).length) return id;
    await d.api.lixeira(id);
    return (await s.ler<{ drive_id: string }>("drive_pastas", { chave }, "drive_id"))[0].drive_id;
  }
  const destino = (p: Pasta) => `livre|${p.id}`;

  /** Devolve o resultado da ação, ou undefined se a ação não é desta pasta. */
  async function acao(nome: string, c: Record<string, unknown>, { eu, pessoaId, origem }: Contexto): Promise<unknown | undefined> {
    const s = servico();
    switch (nome) {
      case "criar_pasta_livre": {
        const empresa = texto(c.empresa_id), nomeNovo = nomeOk(c.nome);
        if (!empresa || !nomeNovo) throw new Recusa(400, "Escreva o nome da pasta.");
        await exigirPessoa(eu);
        if (!(await eu.ler("empresas", { id: empresa }, "id")).length) throw new Recusa(403, "Empresa não encontrada.");
        await nomeLivre(empresa, nomeNovo);
        const pastaDrive = await d.api.criarPasta(nomeNovo, await pastaEmpresa(empresa)); // a pasta já aparece no Drive, ao lado das de formato
        let p: Pasta;
        try {
          [p] = await s.inserir<Pasta>("pastas_livres", { empresa_id: empresa, nome: nomeNovo, permanente: c.permanente === true, criado_por: pessoaId });
        } catch (e) {
          await d.api.lixeira(pastaDrive).catch(() => {});
          if (e instanceof ErroRest && e.status === 409) throw new Recusa(409, "Já existe uma pasta com esse nome.");
          throw e;
        }
        await s.inserir("drive_pastas", { chave: chaves.livre(p.id), drive_id: pastaDrive }, "chave");
        return { pasta: linha(p) };
      }
      case "renomear_pasta_livre": { // com cadeado também pode renomear
        const p = await pastaDe(texto(c.pasta_id)), novo = nomeOk(c.nome);
        if (!novo) throw new Recusa(400, "Escreva o nome da pasta.");
        await exigirPessoa(eu);
        await nomeLivre(p.empresa_id, novo, p.id);
        await d.api.renomear(await driveDa(p), novo); // pelo id, não pelo nome
        await s.atualizar("pastas_livres", { id: p.id }, { nome: novo });
        return { ok: true };
      }
      case "permanente_pasta_livre": {
        const id = texto(c.pasta_id);
        if (!id || typeof c.ligado !== "boolean") throw new Recusa(400, "Pedido inválido.");
        try { await eu.rpc("definir_permanente_livre", { p_pasta: id, p_ligado: c.ligado }); } catch (e) { // o Matheus liga mas o BANCO recusa desligar
          if (e instanceof ErroRest && (e.status === 403 || e.codigo === "42501")) throw new Recusa(403, SEM_CADEADO);
          throw e;
        }
        return { ok: true };
      }
      case "apagar_pasta_livre": {
        const p = await pastaDe(texto(c.pasta_id));
        if (p.permanente) throw new Recusa(409, COM_CADEADO);
        if ((await eu.rpc("pode_apagar_pasta_livre", { p_pasta: p.id })) !== true) throw new Recusa(403, "Você não pode apagar esta pasta.");
        const chave = chaves.livre(p.id);
        const [x] = await s.ler<{ drive_id: string }>("drive_pastas", { chave }, "drive_id");
        // a pasta e tudo que tem nela vão para a lixeira do Drive (volta por 30 dias): cada arquivo e depois a pasta (repetir é seguro)
        for (const a of await s.ler<{ drive_id: string | null }>("arquivos", { pasta_livre_id: p.id }, "drive_id")) if (a.drive_id) await d.api.lixeira(a.drive_id);
        if (x) await d.api.lixeira(x.drive_id);
        await s.apagar("arquivos", { pasta_livre_id: p.id });
        try { await s.apagar("pastas_livres", { id: p.id }); } catch (e) { // o gatilho do banco barra se alguém ligou o cadeado agora
          if (e instanceof ErroRest && (e.status === 403 || e.codigo === "42501")) throw new Recusa(409, COM_CADEADO);
          throw e;
        }
        await s.apagar("drive_pastas", { chave });
        return { ok: true };
      }
      case "sessao_envio_livre": {
        const p = await pastaDe(texto(c.pasta_id)), arq = nomeOk(c.nome, 200), tipo = texto(c.tipo), tamanho = Number(c.tamanho), mime = texto(c.mime) ?? "application/octet-stream";
        if (!arq || !tipo || !TIPOS.includes(tipo) || !(tamanho > 0 && tamanho <= MAX_BYTES)
          || (tipo === "imagem" && !mime.startsWith("image/")) || (tipo === "video" && !mime.startsWith("video/"))) throw new Recusa(400, "Pedido de envio inválido.");
        await exigirPessoa(eu);
        return { sessao_url: await d.api.abrirSessao(await driveDa(p), arq, mime, tamanho, origem, { destino: destino(p) }) };
      }
      case "confirmar_envio_livre": {
        const p = await pastaDe(texto(c.pasta_id)), driveId = texto(c.drive_id), arq = nomeOk(c.nome, 200), tipo = texto(c.tipo), tamanho = Number(c.tamanho);
        if (!driveId || !arq || !tipo || !TIPOS.includes(tipo) || !(tamanho > 0)) throw new Recusa(400, "Confirmação inválida.");
        await exigirPessoa(eu);
        const [ja] = await s.ler<{ id: string; pasta_livre_id: string | null }>("arquivos", { drive_id: driveId }, "id,pasta_livre_id");
        if (ja) {
          if (ja.pasta_livre_id !== p.id) throw new Recusa(409, "Este arquivo já pertence a outro lugar.");
          return { arquivo_id: ja.id };
        }
        const f = await d.api.ver(driveId).catch((e: unknown) => {
          if (e instanceof ErroDrive && e.status === 404) throw new Recusa(410, "O arquivo não existe mais no Drive.");
          throw e;
        });
        if (f.trashed) throw new Recusa(410, "O arquivo foi para a lixeira do Drive.");
        if (f.mimeType === "application/vnd.google-apps.folder" || f.appProperties?.destino !== destino(p)) throw new Recusa(422, "Este arquivo não foi enviado para esta pasta.");
        if (Number(f.size) !== tamanho) {
          await d.api.lixeira(driveId).catch(() => {});
          throw new Recusa(422, "O arquivo não chegou inteiro ao Drive. Tente de novo.");
        }
        const pastaDrive = await driveDa(p);
        if (!f.parents?.includes(pastaDrive)) await d.api.mover(driveId, pastaDrive, f.parents ?? []);
        try {
          const [l] = await s.inserir<{ id: string }>("arquivos", { drive_id: driveId, nome: arq, tipo, tamanho, papel: "anexo", ordem: 0, criado_por: pessoaId, empresa_id: p.empresa_id, pasta_livre_id: p.id });
          return { arquivo_id: l.id };
        } catch (e) {
          const [agora] = await s.ler<{ id: string }>("arquivos", { drive_id: driveId }, "id");
          if (agora) return { arquivo_id: agora.id };
          await d.api.lixeira(driveId).catch(() => {});
          throw e;
        }
      }
      default:
        return undefined;
    }
  }
  return { acao };
}
