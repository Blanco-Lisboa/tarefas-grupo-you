import { beforeEach, describe, expect, it, vi } from "vitest";

// Banco de mentira (só o que ideias.ts usa): select/eq/order, upsert (com onConflict e ignoreDuplicates) e delete/eq.
type L = Record<string, unknown>;
let tabelas: Record<string, L[]>;
let recusar: Set<string>; // operações que o "banco" recusa: "upsert:ideias", "delete:ideias"...
let seq: number;
const fake = {
  from(t: string) {
    const filtros: [string, unknown][] = [];
    let fim: () => { data?: L[]; error: unknown } = () => ({ data: [], error: null });
    const q = {
      select: () => (fim = () => ({ data: tabelas[t].filter((l) => filtros.every(([k, v]) => l[k] === v)).toSorted((a, b) => (a.seq as number) - (b.seq as number)), error: null }), q),
      eq: (k: string, v: unknown) => (filtros.push([k, v]), q),
      order: () => q,
      delete: () => (fim = () => (recusar.has(`delete:${t}`) ? { error: "x" } : ((tabelas[t] = tabelas[t].filter((l) => !filtros.every(([k, v]) => l[k] === v))), { error: null })), q),
      upsert: (linhas: L | L[], o: { onConflict: string; ignoreDuplicates?: boolean }) => (fim = () => {
        if (recusar.has(`upsert:${t}`)) return { error: "x" };
        for (const l of [].concat(linhas as never) as L[]) {
          const i = tabelas[t].findIndex((x) => o.onConflict.split(",").every((k) => x[k] === l[k]));
          if (i < 0) tabelas[t].push({ ...l, seq: ++seq });
          else if (!o.ignoreDuplicates) tabelas[t][i] = { ...tabelas[t][i], ...l };
        }
        return { error: null };
      }, q),
      then: (ok: (r: unknown) => unknown) => Promise.resolve(fim()).then(ok),
    };
    return q;
  },
};
vi.mock("@/lib/supabase/cliente", () => ({ supabase: () => fake }));

let guardado: Map<string, string>;
const CHAVE = "grade-conteudo:ideias:v1";
const ex = (e: string, n: number, categoria: string, titulo: string) => ({ id: `${e}-ideia-${n}`, empresaId: e, categoria, titulo, texto: "t" });
const doNavegador = {
  you: [ex("you", 1, "Formatos de conteúdo", "A"), ex("you", 5, "Perfis - Contabilidade", "Você está pagando imposto a mais"), ex("you", 6, "Perfis - Contabilidade", "Ninguém te conta isso"), ex("you", 7, "Ganchos", "Erro")],
  beec: [ex("beec", 1, "Formatos na prática", "B"), { id: "11111111-1111-4111-8111-111111111111", empresaId: "beec", categoria: "Perfis - Empresários sellers", titulo: "Minha ideia", texto: "", link: "https://x" }],
};

beforeEach(() => {
  vi.resetModules(); // estado novo do módulo = "abrir a página de novo"
  tabelas = { ideias: [], ideias_categorias: [] };
  recusar = new Set();
  seq = 0;
  guardado = new Map([[CHAVE, JSON.stringify(doNavegador)]]);
  vi.stubGlobal("localStorage", { getItem: (k: string) => guardado.get(k) ?? null, setItem: (k: string, v: string) => void guardado.set(k, v) });
});

describe("cópia do navegador para o banco", () => {
  it("sobe tudo, com as 2 da You de volta em Ganchos, categorias na ordem e sem duplicar ao rodar de novo ou em outra aba", async () => {
    const m = await import("./ideias");
    await Promise.all([m.carregarIdeias("you"), m.carregarIdeias("you")]); // duas abas ao mesmo tempo
    expect(tabelas.ideias).toHaveLength(4);
    expect(tabelas.ideias.map((l) => l.categoria)).toEqual(["Formatos de conteúdo", "Ganchos", "Ganchos", "Ganchos"]);
    expect(tabelas.ideias_categorias.map((l) => l.nome)).toEqual(["Formatos de conteúdo", "Ganchos"]);
    expect(guardado.get(`${CHAVE}:subiu:you`)).toBe("1");
    expect(guardado.get(CHAVE)).toBe(JSON.stringify(doNavegador)); // nada apagado do navegador

    vi.resetModules(); // reabre a página
    const outra = await import("./ideias");
    await outra.carregarIdeias("you");
    expect(tabelas.ideias).toHaveLength(4);
  });

  it("o mesmo exemplo vindo de outro endereço cai na mesma linha; a ideia dele e a coluna renomeada sobem inteiras", async () => {
    let m = await import("./ideias");
    await m.carregarIdeias("beec");
    expect(tabelas.ideias).toHaveLength(2);
    expect(tabelas.ideias.find((l) => l.titulo === "Minha ideia")).toMatchObject({ id: "11111111-1111-4111-8111-111111111111", link: "https://x", categoria: "Perfis - Empresários sellers" });
    expect(tabelas.ideias_categorias.map((l) => l.nome)).toEqual(["Formatos na prática", "Perfis - Empresários sellers"]);

    guardado = new Map([[CHAVE, JSON.stringify({ beec: [ex("beec", 1, "Formatos na prática", "B")] })]]); // outro endereço, mesmo exemplo
    vi.resetModules();
    m = await import("./ideias");
    await m.carregarIdeias("beec");
    expect(tabelas.ideias).toHaveLength(2);
  });

  it("se o banco recusar, não marca como subiu e tenta de novo na próxima abertura", async () => {
    recusar.add("upsert:ideias");
    let m = await import("./ideias");
    await m.carregarIdeias("you");
    expect(guardado.has(`${CHAVE}:subiu:you`)).toBe(false);
    recusar.clear();
    vi.resetModules();
    m = await import("./ideias");
    await m.carregarIdeias("you");
    expect(tabelas.ideias).toHaveLength(4);
  });
});

describe("mural no banco: salvar, mover e apagar", () => {
  it("grava, edita e apaga; se o banco recusar, a tela volta ao que era", async () => {
    guardado.clear();
    const m = await import("./ideias");
    await m.carregarIdeias("you");
    const a = m.gravarIdeia("you", { categoria: "Ganchos", titulo: "Nova", texto: "" });
    await vi.waitFor(() => expect(tabelas.ideias).toHaveLength(1));
    m.gravarIdeia("you", { ...a, categoria: "Datas e sazonais" });
    await vi.waitFor(() => expect(tabelas.ideias[0].categoria).toBe("Datas e sazonais"));

    recusar.add("delete:ideias");
    m.apagarIdeia("you", a.id);
    await vi.waitFor(() => expect(tabelas.ideias).toHaveLength(1)); // recusou: continua no banco
    await m.carregarIdeias("you");
    expect(tabelas.ideias).toHaveLength(1);
    recusar.clear();
    m.apagarIdeia("you", a.id);
    await vi.waitFor(() => expect(tabelas.ideias).toHaveLength(0));
  });

  it("coluna nova fica guardada mesmo vazia", async () => {
    guardado.clear();
    const m = await import("./ideias");
    m.criarCategoria("beec", "Coluna vazia");
    await vi.waitFor(() => expect(tabelas.ideias_categorias.map((l) => l.nome)).toEqual(["Coluna vazia"]));
  });
});
