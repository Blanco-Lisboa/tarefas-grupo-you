import { describe, expect, it } from "vitest";
import { daLinha, paraBanco, trocarFazendo } from "./repositorio";

const quem = (id: string | null) => ({ a: "natham", b: "matheus" } as const)[id as "a" | "b"];
const linha: Parameters<typeof daLinha>[0] = {
  id: "t1", titulo: "Roteiro", tipo: "roteiro", empresa_id: null, rede: null, etapa: "roteiro", responsavel_id: "b",
  inicio: "2026-10-21T14:00", fim: null, dia_inteiro: false, cor: "etiqueta-5", concluida: false, objetivo: null, notas: null,
  links: [], aprovador: null, dono_id: "a", criado_por: "a", enviada_por: "a", tarefa_tags: [{ tag_id: "x" }],
};

describe("repositório: linha do banco <-> tarefa da tela", () => {
  it("traduz pessoas, nulos e tags", () => {
    const t = daLinha({ ...linha }, [], quem);
    expect(t).toMatchObject({ responsavel: "matheus", dono: "natham", enviadaPor: "natham", empresaId: "", rede: undefined, tags: ["x"], concluida: undefined });
  });
  it("volta para o banco sem mexer em dono, criado_por e enviada_por", () => {
    const campos = paraBanco(daLinha({ ...linha }, [], quem), "b");
    expect(campos).toMatchObject({ empresa_id: null, etapa: "roteiro", responsavel_id: "b", concluida: false });
    expect(campos).not.toHaveProperty("dono_id");
    expect(campos).not.toHaveProperty("criado_por");
    expect(campos).not.toHaveProperty("enviada_por");
  });
});

describe("fazendo agora", () => {
  it("começar outra tarefa troca a anterior; parar tira; os outros ficam", () => {
    let m = trocarFazendo({}, "natham", "t1", "d1");
    m = trocarFazendo(m, "matheus", "t2", "d2");
    m = trocarFazendo(m, "natham", "t3", "d3");
    expect(m).toEqual({ t2: { quem: "matheus", desde: "d2" }, t3: { quem: "natham", desde: "d3" } });
    expect(trocarFazendo(m, "natham", null)).toEqual({ t2: { quem: "matheus", desde: "d2" } });
  });
});
