// 274 · achado 4 da Lupa: a leitura disparada pelo aviso do banco não pode pôr dado velho por cima de uma gravação.
import { expect, it, vi } from "vitest";

let linhas: { id: string; titulo: string }[] = [];
let soltar: (() => void) | undefined; // segura a resposta da leitura de tarefas até o teste mandar
let segurar = false;
const base = (tabela: string): unknown => {
  const dados = tabela === "pessoas" ? [{ id: "p1", slug: "natham", user_id: "u1" }] : tabela === "tarefas" ? linhas.map((l) => ({ ...tipoBase, ...l })) : [];
  const r = { data: dados, error: null };
  const cadeia: unknown = new Proxy(() => cadeia, {
    get: (_, k) => (k === "then" ? (ok: (v: unknown) => void) => (tabela === "tarefas" && segurar ? void (soltar = () => ok(r)) : ok(r)) : () => cadeia),
    apply: () => cadeia,
  });
  return cadeia;
};
const tipoBase = { tipo: "outro", empresa_id: null, rede: null, etapa: null, responsavel_id: "p1", inicio: null, fim: null, dia_inteiro: false, cor: "etiqueta-5", concluida: false, links: [], dono_id: "p1", criado_por: "p1" };
vi.mock("@/lib/supabase/cliente", () => ({
  supabase: () => ({ from: base, rpc: () => base("rpc"), auth: { getClaims: async () => ({ data: { claims: { sub: "u1" } } }) }, channel: () => ({ on: () => ({ on: () => ({ subscribe: () => ({}) }) }), subscribe: () => ({}) }), removeChannel: () => {} }),
}));
vi.stubGlobal("window", {});
vi.stubGlobal("document", { hidden: false, addEventListener: () => {} });

import { assinar, lerTarefas, salvarTarefa } from "./repositorio";

it("leitura que nasceu antes da gravação é descartada e não faz o card voltar", async () => {
  linhas = [{ id: "t1", titulo: "antigo" }];
  assinar(() => {});
  await vi.waitFor(() => expect(lerTarefas()).toHaveLength(1));
  segurar = true;
  const { carregarAgora } = await import("./repositorio");
  const leitura = carregarAgora(); // aviso do banco: leitura começa e fica esperando a resposta (dado ANTIGO)
  await vi.waitFor(() => expect(soltar).toBeDefined());
  segurar = false;
  await salvarTarefa({ id: "t1", titulo: "novo", tipo: "outro", empresaId: "", responsavel: "natham", diaInteiro: false, cor: "etiqueta-5", links: [], arquivos: [] } as never);
  expect(lerTarefas()[0].titulo).toBe("novo");
  soltar!(); // a resposta antiga chega por último
  await leitura;
  expect(lerTarefas()[0].titulo).toBe("novo");
});
