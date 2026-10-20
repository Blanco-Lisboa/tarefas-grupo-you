// Banco FALSO em memória para provar as funções sem Supabase real: um `fetch` que fala o suficiente de PostgREST, /auth/v1/user e Storage.
// Só para teste. As regras de permissão (RLS, RPCs) são injetadas pelo teste, para provar que a função obedece ao banco.
export const URL_FALSA = "https://banco.falso";
type Linha = Record<string, unknown>;

export function criarBancoFalso() {
  const tabelas: Record<string, Linha[]> = { pessoas: [], empresas: [], tarefas: [], ocasioes: [], arquivos: [], drive_pastas: [] };
  const usuarios = new Map<string, string>(); // token -> user id (auth)
  const unicos: Record<string, (l: Linha) => string> = {
    drive_pastas: (l) => String(l.chave),
    ocasioes: (l) => `${l.empresa_id}|${String(l.nome).trim().toLowerCase()}`,
    arquivos: (l) => `d:${l.drive_id}`,
  };
  const estado = {
    tabelas, usuarios,
    rpcs: {} as Record<string, (args: Linha, token: string) => unknown>,
    /** chave de serviço aceita; qualquer outro bearer só vale se estiver em `usuarios`. */
    servico: "chave-servico-falsa", anon: "chave-anon-falsa",
    objetosRemovidos: [] as string[],
    chamadasRpc: [] as { nome: string; args: Linha }[],
    /** quem pode ler cada tabela com a chave do usuário (RLS falsa); padrão: tudo. */
    le: (...[,,]: [string, Linha, string]) => true as boolean,
    /** trava do banco ao apagar tarefa com a chave do usuário. */
    podeApagarTarefa: (...[,]: [string, string]) => true as boolean,
    falharStorage: false,
    contador: 0,
  };

  const filtrar = (tabela: string, q: URLSearchParams) => {
    const f = [...q.entries()].filter(([k, v]) => v.startsWith("eq.") && k !== "select" && k !== "on_conflict");
    return tabelas[tabela].filter((l) => f.every(([k, v]) => String(l[k] ?? "") === decodeURIComponent(v.slice(3))));
  };
  const json = (c: unknown, status = 200) => new Response(JSON.stringify(c), { status, headers: { "content-type": "application/json" } });

  async function tratar(entrada: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const req = new Request(entrada, init);
    const u = new URL(req.url);
    if (u.origin !== URL_FALSA) return json({ erro: "fora do banco falso" }, 599);
    const token = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "")?.[1] ?? "";
    const ehServico = token === estado.servico;
    if (u.pathname === "/auth/v1/user") return usuarios.has(token) ? json({ id: usuarios.get(token) }) : json({}, 401);
    if (!ehServico && !usuarios.has(token)) return json({ code: "PGRST301" }, 401);

    const mStorage = /^\/storage\/v1\/object\/(\w+)$/.exec(u.pathname);
    if (mStorage && req.method === "DELETE") {
      if (estado.falharStorage) return json({}, 500);
      estado.objetosRemovidos.push(...((await req.json()) as { prefixes: string[] }).prefixes);
      return json([]);
    }
    const mRpc = /^\/rest\/v1\/rpc\/(\w+)$/.exec(u.pathname);
    if (mRpc) {
      const args = (await req.json().catch(() => ({}))) as Linha;
      estado.chamadasRpc.push({ nome: mRpc[1], args });
      const f = estado.rpcs[mRpc[1]];
      return f ? json(f(args, token) ?? null) : json({ code: "PGRST202" }, 404);
    }
    const mTab = /^\/rest\/v1\/(\w+)$/.exec(u.pathname);
    if (!mTab || !tabelas[mTab[1]]) return json({}, 404);
    const t = mTab[1];
    if (req.method === "GET") return json(filtrar(t, u.searchParams).filter((l) => ehServico || estado.le(t, l, token)));
    if (req.method === "POST") {
      if (!ehServico && t !== "tarefas") return json({ code: "42501" }, 403); // escrita de usuário só onde a trava deixa; o resto é só da função
      const l = { ...((await req.json()) as Linha) };
      if (t !== "drive_pastas") l.id ??= `${t}-${++estado.contador}`;
      const chave = unicos[t]?.(l);
      if (chave && tabelas[t].some((x) => unicos[t](x) === chave)) {
        return u.searchParams.get("on_conflict") ? json([]) : json({ code: "23505" }, 409);
      }
      if (t === "arquivos" && l.papel === "capa" && tabelas.arquivos.some((x) => x.tarefa_id === l.tarefa_id && x.papel === "capa")) return json({ code: "23505" }, 409);
      tabelas[t].push(l);
      return json([l], 201);
    }
    const alvo = filtrar(t, u.searchParams);
    if (req.method === "PATCH") {
      const c = (await req.json()) as Linha;
      alvo.forEach((l) => Object.assign(l, c));
      return json(alvo);
    }
    if (req.method === "DELETE") {
      if (!ehServico) {
        if (t !== "tarefas") return json([]);
        const ok = alvo.filter((l) => estado.podeApagarTarefa(String(l.id), token));
        // trava 019: card com arquivo no Drive não se apaga direto
        if (ok.some((l) => tabelas.arquivos.some((a) => a.tarefa_id === l.id && a.drive_id))) return json({ code: "42501" }, 403);
        tabelas[t] = tabelas[t].filter((l) => !ok.includes(l));
        return json(ok);
      }
      tabelas[t] = tabelas[t].filter((l) => !alvo.includes(l));
      return json(alvo);
    }
    return json({}, 405);
  }
  return { fetch: tratar as typeof fetch, estado };
}
