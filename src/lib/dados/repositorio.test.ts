import { describe, expect, it } from "vitest";
import { daLinha, funcaoAusente, motivoDoBanco, paraBanco, podeAlterar, podeApagar, trocarFazendo } from "./repositorio";

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
  it("vai_pro_google: lido do banco, nunca reenviado na edição (o banco trava depois de criada)", () => {
    expect(daLinha({ ...linha, vai_pro_google: true }, [], quem).vaiProGoogle).toBe(true);
    expect(daLinha({ ...linha }, [], quem).vaiProGoogle).toBeUndefined();
    expect(paraBanco(daLinha({ ...linha, vai_pro_google: true }, [], quem), "b")).not.toHaveProperty("vai_pro_google");
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

describe("quem pode mexer na tarefa (espelha o banco)", () => {
  const base = daLinha({ ...linha, etapa: null, enviada_por: "a", dono_id: "b" }, [], quem); // Natham enviou ao Matheus
  const privadaDoMatheus = daLinha({ ...linha, etapa: null, enviada_por: null, dono_id: "b", criado_por: "b" }, [], quem);
  it("enviada: quem enviou edita e apaga; quem recebeu só lê", () => {
    expect([podeAlterar(base, "natham"), podeApagar(base, "natham")]).toEqual([true, true]);
    expect([podeAlterar(base, "matheus"), podeApagar(base, "matheus")]).toEqual([false, false]);
  });
  it("enviada com empresa: quem recebeu continua só lendo, mas a lixeira do conteúdo é do Natham e do Matheus (019)", () => {
    const c = { ...base, etapa: "roteiro" as const, empresaId: "you" };
    expect([podeAlterar(c, "matheus"), podeApagar(c, "matheus"), podeAlterar(c, "natham"), podeApagar(c, "natham")]).toEqual([false, true, true, true]);
  });
  it("não enviada: o dono faz os dois", () => {
    expect([podeAlterar(privadaDoMatheus, "matheus"), podeApagar(privadaDoMatheus, "matheus")]).toEqual([true, true]);
  });
  it("Natham só lê a privada do Matheus", () => {
    expect([podeAlterar(privadaDoMatheus, "natham"), podeApagar(privadaDoMatheus, "natham")]).toEqual([false, false]);
  });
  it("conteúdo com empresa: os dois editam", () => {
    const c = { ...privadaDoMatheus, etapa: "roteiro" as const, empresaId: "you" };
    expect(podeAlterar(c, "natham")).toBe(true);
    expect(podeAlterar(c, null)).toBe(false);
  });
  it("conteúdo com empresa: o Natham e o Matheus apagam (lixeira e Concluir, 019); Adrian e Lucas não", () => {
    const c = { ...privadaDoMatheus, etapa: "roteiro" as const, empresaId: "you" };
    expect([podeApagar(c, "matheus"), podeApagar(c, "natham"), podeApagar(c, "adrian"), podeApagar(c, null)]).toEqual([true, true, false, false]);
  });
});

describe("recusa do banco em português", () => {
  it("42501 = quem aprova; 23514 de Postagem = use Concluir; o resto fica no texto padrão", () => {
    expect(motivoDoBanco({ code: "42501" }, "x")).toMatch(/quem aprova/);
    expect(motivoDoBanco({ code: "23514", message: "so card do tipo Postagem vai para Aprovado" }, "x")).toMatch(/Concluir/);
    expect([motivoDoBanco({ code: "23514", message: "tarefas_legenda_ok" }, "x"), motivoDoBanco(null, "x")]).toEqual(["x", "x"]);
  });
});

describe("salvar_tarefa ainda não aplicada", () => {
  it("só 'função não existe' cai no caminho antigo; outro erro continua erro", () => {
    expect([funcaoAusente({ code: "PGRST202" }), funcaoAusente({ code: "42883" })]).toEqual([true, true]);
    expect([funcaoAusente({ code: "42501" }), funcaoAusente({ code: "P0001" }), funcaoAusente(null)]).toEqual([false, false, false]);
  });
});
