import { describe, expect, it } from "vitest";
import type { Tarefa } from "@/lib/dados";
import { doCaderno, daMinhaLista, ehConteudo, ehReuniao, montarGrade, msAteMeiaNoite, rotuloSlot, SLOTS } from "./grade";
import { notaDaChave } from "./notas";

const t = (id: string, inicio?: string, diaInteiro = false) =>
  ({ id, titulo: id, tipo: "outro", empresaId: "e", responsavel: "natham", inicio, diaInteiro, cor: "etiqueta-1", links: [], arquivos: [] }) as Tarefa;

describe("grade do caderno", () => {
  it("rotula de 07:00 a 22:00", () => {
    expect(rotuloSlot(0)).toBe("07:00");
    expect(rotuloSlot(SLOTS - 1)).toBe("22:00");
    expect(rotuloSlot(SLOTS)).toBe("");
  });
  it("põe cada tarefa na linha da hora, desce se ocupada, e dia inteiro vai para a primeira livre", () => {
    const g = montarGrade([t("a", "2026-10-20T06:00"), t("b", "2026-10-20T07:10"), t("c", "2026-10-20T09:30"), t("d", "2026-10-20", true)], true);
    expect(g.length).toBe(SLOTS);
    expect(g[0]?.id).toBe("a");
    expect(g[1]?.id).toBe("b");
    expect(g[5]?.id).toBe("c");
    expect(g[2]?.id).toBe("d");
  });
  it("sem porHora ignora o horário e mantém a ordem", () => {
    const g = montarGrade([t("a", "2026-10-20T20:00"), t("b")], false);
    expect([g[0]?.id, g[1]?.id]).toEqual(["a", "b"]);
  });
});

describe("anotações do dia", () => {
  const armazem = { getItem: (k: string) => ({ "d:20": "nota do 20", "d:21": "nota do 21" } as Record<string, string>)[k] ?? null, setItem: () => {} };
  it("trocar de dia mostra a nota do dia novo, não a do anterior", () => {
    const dia20 = notaDaChave(null, "d:20", armazem);
    expect(dia20.valor).toBe("nota do 20");
    expect(notaDaChave(dia20, "d:21", armazem).valor).toBe("nota do 21");
    expect(notaDaChave(dia20, "d:22", armazem).valor).toBe("");
  });
  it("mesma chave mantém o que está sendo digitado", () => {
    expect(notaDaChave({ chave: "d:20", valor: "digitando" }, "d:20", armazem).valor).toBe("digitando");
  });
});

describe("virada da meia-noite", () => {
  it("conta até a próxima meia-noite local", () => {
    expect(msAteMeiaNoite(new Date(2026, 9, 19, 23, 59, 0))).toBe(60_500);
    expect(msAteMeiaNoite(new Date(2026, 9, 19, 0, 0, 0))).toBe(86_400_500);
  });
});

describe("de quem é o caderno", () => {
  const priv = { ...t("p"), empresaId: undefined, dono: "natham", responsavel: "matheus" } as unknown as Tarefa;
  const conteudo = { ...t("c"), etapa: "roteiro", dono: "natham", responsavel: "matheus" } as Tarefa;
  it("privada segue o dono, não o responsável", () => {
    expect(doCaderno(priv, "natham")).toBe(true);
    expect(doCaderno(priv, "matheus")).toBe(false);
  });
  it("sem dono cai no responsável; sem `de` mostra tudo", () => {
    expect(doCaderno({ ...priv, dono: undefined }, "matheus")).toBe(true);
    expect(doCaderno(priv, null)).toBe(true);
  });
  it("conteúdo com empresa segue o responsável", () => {
    expect(doCaderno(conteudo, "matheus")).toBe(true);
    expect(doCaderno(conteudo, "natham")).toBe(false);
  });
});

describe("lista pessoal compartilhada pelas telas", () => {
  const privada = { ...t("privada", "2026-10-20"), etapa: "roteiro", empresaId: "", dono: "matheus", responsavel: "matheus" } as Tarefa;
  const postagem = { ...privada, id: "postagem", tipo: "postagem" } as Tarefa;
  const atrasada = { ...privada, id: "atrasada", inicio: "2026-10-19" } as Tarefa;
  const deEmpresa = { ...privada, id: "empresa", empresaId: "beec" } as Tarefa;
  const minha = { ...privada, id: "minha", dono: "natham", responsavel: "matheus" } as Tarefa;

  it("oculta roteiro, postagem e atraso privados de outra pessoa", () => {
    expect([privada, postagem, atrasada].filter((tarefa) => daMinhaLista(tarefa, "natham"))).toEqual([]);
  });
  it("mostra conteúdo com empresa de todos e tarefas do dono", () => {
    expect([deEmpresa, minha].filter((tarefa) => daMinhaLista(tarefa, "natham")).map((tarefa) => tarefa.id)).toEqual(["empresa", "minha"]);
  });
  it("sem usuário identificado só mostra conteúdo com empresa", () => {
    expect([privada, deEmpresa, minha].filter((tarefa) => daMinhaLista(tarefa, null)).map((tarefa) => tarefa.id)).toEqual(["empresa"]);
  });
});

describe("separação entre tarefa do caderno e conteúdo", () => {
  const base = { ...t("base"), tipo: "postagem", etapa: "roteiro", empresaId: "beec" } as Tarefa;

  it("exige etapa e empresa, independentemente do tipo", () => {
    expect(ehConteudo(base)).toBe(true);
    const outroTipo = { ...base, tipo: "roteiro" as const };
    expect(ehConteudo(outroTipo)).toBe(true);
    expect(ehConteudo({ ...base, empresaId: "" })).toBe(false);
    expect(ehConteudo({ ...base, etapa: undefined })).toBe(false);
  });

  it("reconhece reunião pelo título, sem ligar para maiúscula ou acento", () => {
    for (const s of ["Reunião", "reuniao", "REUNIÃO", "Reuniões da semana", "Reunião com cliente", "Reun. com a Beec", "Call: reunião"])
      expect(ehReuniao({ titulo: s }), s).toBe(true);
    for (const s of ["Reunir material", "Gravar reels", "Desreuniao"]) expect(ehReuniao({ titulo: s }), s).toBe(false);
    expect(ehReuniao({ titulo: "Pauta da semana", tipo: "reuniao" })).toBe(true);
  });

  it("reunião com etapa e empresa não é conteúdo, mas segue no caderno e no calendário do dono", () => {
    const reuniao = { ...base, titulo: "Reunião com a Beec", dono: "natham", responsavel: "natham" } as Tarefa;
    expect(ehConteudo(reuniao)).toBe(false);
    expect(doCaderno(reuniao, "natham")).toBe(true);
    expect(daMinhaLista(reuniao, "natham")).toBe(true);
    expect(daMinhaLista(reuniao, "matheus")).toBe(false);
  });

  it("mantém a tarefa pessoal no caderno e na lista do calendário", () => {
    const pessoal = { ...base, empresaId: "", dono: "matheus", responsavel: "matheus" } as Tarefa;
    expect(doCaderno(pessoal, "matheus")).toBe(true);
    expect(daMinhaLista(pessoal, "matheus")).toBe(true);
    expect(ehConteudo(pessoal)).toBe(false);
  });
});
