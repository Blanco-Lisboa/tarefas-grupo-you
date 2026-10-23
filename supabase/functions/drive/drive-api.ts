// Chamadas ao Google Drive v3. Recebe o token e a base por injeção: no teste a base é o Google falso.
type Busca = typeof fetch;
export type Contexto = { api: string; token: () => Promise<string>; fetch?: Busca };
export type ArquivoDrive = { id: string; name?: string; parents?: string[]; size?: string; mimeType?: string; trashed?: boolean; appProperties?: Record<string, string> };

export class ErroDrive extends Error {
  constructor(public status: number) {
    super(`Drive ${status}`);
  }
}

export function criarDriveApi(c: Contexto) {
  const buscar: Busca = c.fetch ?? ((...a) => fetch(...a));
  async function chamar(url: string, init: RequestInit = {}) {
    const r = await buscar(url, { ...init, headers: { authorization: `Bearer ${await c.token()}`, "content-type": "application/json", ...(init.headers as Record<string, string>) } });
    if (!r.ok) throw new ErroDrive(r.status);
    return r;
  }
  const arq = (id: string) => `${c.api}/drive/v3/files/${encodeURIComponent(id)}`;
  return {
    async criarPasta(nome: string, pai?: string): Promise<string> {
      const r = await chamar(`${c.api}/drive/v3/files?fields=id`, { method: "POST", body: JSON.stringify({ name: nome, mimeType: "application/vnd.google-apps.folder", ...(pai ? { parents: [pai] } : {}) }) });
      return ((await r.json()) as { id: string }).id;
    },
    async renomear(id: string, nome: string) {
      await chamar(`${arq(id)}?fields=id`, { method: "PATCH", body: JSON.stringify({ name: nome }) });
    },
    /** Dá acesso de editor, sem e-mail de aviso. */
    async compartilhar(id: string, email: string) {
      await chamar(`${arq(id)}/permissions?sendNotificationEmail=false`, { method: "POST", body: JSON.stringify({ role: "writer", type: "user", emailAddress: email }) });
    },
    /** Abre a sessão de envio retomável com Origin do app: é o endereço (Location) que o navegador usa para mandar as partes direto ao Drive. */
    async abrirSessao(pasta: string, nome: string, tipoMime: string, tamanho: number, origem: string, etiqueta: Record<string, string>): Promise<string> {
      const r = await chamar(`${c.api}/upload/drive/v3/files?uploadType=resumable&fields=id`, {
        method: "POST",
        headers: { "x-upload-content-type": tipoMime, "x-upload-content-length": String(tamanho), origin: origem },
        body: JSON.stringify({ name: nome, parents: [pasta], appProperties: etiqueta }), // etiqueta posta só por aqui: diz para qual card (tarefa) ou qual pasta (destino) é o envio
      });
      const url = r.headers.get("location");
      if (!url) throw new ErroDrive(502);
      return url;
    },
    async ver(id: string): Promise<ArquivoDrive> {
      return (await (await chamar(`${arq(id)}?fields=id,name,parents,size,mimeType,trashed,appProperties`)).json()) as ArquivoDrive;
    },
    /** Muda o arquivo de pasta (addParents/removeParents), sem copiar nada. */
    async mover(id: string, para: string, de: string[]) {
      await chamar(`${arq(id)}?fields=id&addParents=${encodeURIComponent(para)}${de.length ? `&removeParents=${encodeURIComponent(de.join(","))}` : ""}`, { method: "PATCH", body: "{}" });
    },
    /** Manda para a lixeira do Google (volta por 30 dias). Arquivo que já não existe conta como feito. */
    async lixeira(id: string) {
      try {
        await chamar(`${arq(id)}?fields=id`, { method: "PATCH", body: JSON.stringify({ trashed: true }) });
      } catch (e) {
        if (!(e instanceof ErroDrive && e.status === 404)) throw e;
      }
    },
    async quemSou(): Promise<string | undefined> {
      const r = await chamar(`${c.api}/drive/v3/about?fields=user(emailAddress)`);
      return ((await r.json()) as { user?: { emailAddress?: string } }).user?.emailAddress;
    },
  };
}
export type DriveApi = ReturnType<typeof criarDriveApi>;
