import { describe, expect, it } from "vitest";
import type { EventoAgenda, Tarefa } from "@/lib/dados";
import { doCaderno, encaixarCompromissos, jaTemTarefa, separarCompromissos, titulosParecidos, daMinhaLista, enviadaPorMim, somenteNoDeQuemRecebeu, ehConteudo, ehReuniao, eventosDoDia, duracaoDe, duracaoMaxima, emConflito, linhasDoBloco, montarGrade, msAteMeiaNoite, quandoEvento, rotuloSlot, SLOTS } from "./grade";

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

describe("tarefa longa (item 275)", () => {
  const longa = (id: string, inicio: string, fim?: string) => ({ ...t(id, inicio), fim }) as Tarefa;
  it("duração: fim menos início; sem fim ou fim em outro dia = 30 min", () => {
    expect(duracaoDe(longa("a", "2026-10-20T10:30", "2026-10-20T12:30"))).toBe(120);
    expect(duracaoDe(longa("b", "2026-10-20T10:30"))).toBe(30);
    expect(duracaoDe(longa("c", "2026-10-20T10:30", "2026-10-21T12:30"))).toBe(30);
  });
  it("10:30 com 2h toma 4 linhas; com outra tarefa já na 11:00 o bloco para antes dela", () => {
    const a = longa("a", "2026-10-20T10:30", "2026-10-20T12:30");
    const g = montarGrade([a, t("b", "2026-10-20T11:00")], true, true);
    expect(linhasDoBloco(g, 7)).toBe(1);
    expect((g[8] as Tarefa).id).toBe("b");
    const livre = montarGrade([a], true, true);
    expect(linhasDoBloco(livre, 7)).toBe(4);
    expect((livre[8] as { continuaDe: Tarefa }).continuaDe.id).toBe("a");
  });
  it("achado 7: 09:00 às 11:00 e outra às 10:00: a de 10:00 fica na sua linha e o bloco da primeira para antes dela", () => {
    const g = montarGrade([longa("a", "2026-10-20T09:00", "2026-10-20T11:00"), longa("b", "2026-10-20T10:00", "2026-10-20T10:30")], true, true);
    expect((g[6] as Tarefa).id).toBe("b"); // 10:00 = linha 6
    expect(linhasDoBloco(g, 4)).toBe(2);
    expect(duracaoMaxima(g, 4, "09:00")).toBe(60); // o menu só oferece até 1h
    expect(duracaoMaxima(g, 6, "10:00")).toBe(750); // depois dela tudo livre até 22:30
  });
  it("sobreposição antiga: só avisa (não há o que gravar); sem sobreposição não há aviso", () => {
    const a = longa("a", "2026-10-20T09:00", "2026-10-20T11:00");
    const g = montarGrade([a, longa("b", "2026-10-20T10:00", "2026-10-20T10:30")], true, true);
    expect(emConflito(g, 4, a)).toBe(true);
    expect(a.fim).toBe("2026-10-20T11:00"); // o gravado não muda
    expect(emConflito(montarGrade([a], true, true), 4, a)).toBe(false);
  });
  it("sem o terceiro argumento (Mapa) só vêm tarefas", () => {
    const g = montarGrade([longa("a", "2026-10-20T10:30", "2026-10-20T12:30")], true);
    expect(g.filter(Boolean).length).toBe(1);
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
  it("tarefa enviada fica no caderno de quem enviou e no de quem recebeu, sem repetir (R4-3)", () => {
    const enviada = { ...priv, dono: "natham", enviadaPor: "matheus", responsavel: "natham" } as Tarefa;
    expect([doCaderno(enviada, "matheus"), doCaderno(enviada, "natham"), doCaderno(enviada, "adrian")]).toEqual([true, true, false]);
    expect([enviadaPorMim(enviada, "matheus"), enviadaPorMim(enviada, "natham")]).toEqual([true, false]);
    expect(daMinhaLista(enviada, "matheus")).toBe(true);
  });
  it("263: o que o Natham envia sai do caderno dele e fica só no de quem recebeu; Matheus segue como antes", () => {
    const deNatham = { ...priv, dono: "matheus", enviadaPor: "natham", responsavel: "matheus" } as Tarefa;
    const deMatheus = { ...priv, dono: "natham", enviadaPor: "matheus", responsavel: "natham" } as Tarefa;
    expect(somenteNoDeQuemRecebeu(deNatham, "natham", "natham")).toBe(true);
    expect(doCaderno(deNatham, "matheus")).toBe(true); // visto pelo Natham no "Caderno de Matheus"
    expect(somenteNoDeQuemRecebeu(deNatham, "matheus", "natham")).toBe(false);
    expect(somenteNoDeQuemRecebeu(deMatheus, "matheus", "matheus")).toBe(false);
    expect(somenteNoDeQuemRecebeu(priv, "natham", "natham")).toBe(false);
  });
  it("266: o que o Adrian manda ao Matheus sai do caderno dele; ao Natham, fica (ele não abre o caderno do Natham)", () => {
    const paraMatheus = { ...priv, dono: "matheus", enviadaPor: "adrian", responsavel: "matheus" } as Tarefa;
    const paraNatham = { ...priv, dono: "natham", enviadaPor: "adrian", responsavel: "natham" } as Tarefa;
    expect(somenteNoDeQuemRecebeu(paraMatheus, "adrian", "adrian")).toBe(true);
    expect(doCaderno(paraMatheus, "matheus")).toBe(true);
    expect(somenteNoDeQuemRecebeu(paraNatham, "adrian", "adrian")).toBe(false);
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

const ev = (id: string, inicio: string, extra: Partial<EventoAgenda> = {}): EventoAgenda =>
  ({ id, titulo: id, inicio, diaInteiro: false, particular: false, fontes: ["natham"], ...extra });

describe("agenda do Google no caderno (item 190)", () => {
  it("só mostra o dia, só a agenda do dono, dia inteiro primeiro e depois por hora", () => {
    const todos = [
      ev("tarde", "2026-10-20T15:00"),
      ev("manha", "2026-10-20T09:00"),
      ev("outro-dia", "2026-10-21T09:00"),
      ev("do-matheus", "2026-10-20T08:00", { fontes: ["matheus"] }),
      ev("viagem", "2026-10-19", { diaInteiro: true, fim: "2026-10-21", fontes: ["natham", "contato"] }),
    ];
    expect(eventosDoDia(todos, "2026-10-20", "natham").map((e) => e.id)).toEqual(["viagem", "manha", "tarde"]);
    expect(eventosDoDia(todos, "2026-10-20", "matheus").map((e) => e.id)).toEqual(["do-matheus"]);
    expect(eventosDoDia(todos, "2026-10-20", null)).toEqual([]);
  });
  it("compromisso que termina 00:00 não ocupa o dia seguinte (R4-5)", () => {
    const noite = ev("noite", "2026-10-20T22:00", { fim: "2026-10-21T00:00" });
    expect(eventosDoDia([noite], "2026-10-20", "natham")).toHaveLength(1);
    expect(eventosDoDia([noite], "2026-10-21", "natham")).toEqual([]);
  });
  it("escreve o horário", () => {
    expect(quandoEvento(ev("a", "2026-10-20T09:00", { fim: "2026-10-20T10:30" }), "2026-10-20")).toBe("09:00 às 10:30");
    expect(quandoEvento(ev("b", "2026-10-20T09:00"), "2026-10-20")).toBe("a partir das 09:00");
    expect(quandoEvento(ev("c", "2026-10-20", { diaInteiro: true }), "2026-10-20")).toBe("dia inteiro");
    expect(quandoEvento(ev("d", "2026-10-19T22:00", { fim: "2026-10-20T02:00" }), "2026-10-20")).toBe("até as 02:00");
  });
});

describe("compromissos do Google nas linhas (item 221)", () => {
  const dia = "2026-10-21";
  const ev = (id: string, inicio: string, fim?: string, extra: Partial<EventoAgenda> = {}) =>
    ({ id, titulo: id, inicio, fim, diaInteiro: false, particular: false, fontes: ["natham"], ...extra }) as EventoAgenda;
  const onde = (g: ReturnType<typeof encaixarCompromissos>) => g.map((l, k) => (l && "evento" in l ? `${k}:${l.evento.id}${l.primeira ? "" : "+"}` : l ? `${k}:t` : "")).filter(Boolean);

  it("30 min cai na linha da hora; 11:15 às 11:45 pinta 11:00 e 11:30; 2h pinta 4 linhas", () => {
    const g = encaixarCompromissos(montarGrade([], true), [ev("a", `${dia}T09:00`, `${dia}T09:30`), ev("b", `${dia}T11:15`, `${dia}T11:45`), ev("c", `${dia}T14:00`, `${dia}T16:00`)], dia);
    expect(onde(g)).toEqual(["4:a", "8:b", "9:b+", "14:c", "15:c+", "16:c+", "17:c+"]);
    const b = g[8];
    expect(b && "evento" in b && b.inicio).toBe("11:15");
  });
  it("qualquer meia hora tocada é pintada: 10:15 às 10:45, 10:00 às 10:30, 09:50 às 10:10, e o que passa das 22:00", () => {
    const linhas = (ini: string, fim: string) => onde(encaixarCompromissos(montarGrade([], true), [ev("e", `${dia}T${ini}`, `${dia}T${fim}`)], dia));
    expect(linhas("10:15", "10:45")).toEqual(["6:e", "7:e+"]);
    expect(linhas("10:00", "10:30")).toEqual(["6:e"]);
    expect(linhas("09:50", "10:10")).toEqual(["5:e", "6:e+"]);
    expect(linhas("21:45", "22:45")).toEqual(["29:e", "30:e+"]); // 22:30 em diante não tem linha
    expect(linhas("22:15", "23:30")).toEqual(["30:e"]);
  });
  it("na mesma hora de uma tarefa: o compromisso fica na linha de baixo", () => {
    const g = encaixarCompromissos(montarGrade([t("x", `${dia}T11:00`)], true), [ev("a", `${dia}T11:00`, `${dia}T11:30`)], dia);
    expect(onde(g)).toEqual(["8:t", "9:a"]);
  });
  it("longo para de pintar ao achar linha ocupada; começa antes de 07:00 e entra pela primeira linha", () => {
    const g = encaixarCompromissos(montarGrade([t("x", `${dia}T09:00`)], true), [ev("a", `${dia}T06:00`, `${dia}T09:30`), ev("b", `${dia}T08:30`, `${dia}T10:00`)], dia);
    expect(onde(g)).toEqual(["0:a", "1:a+", "2:a+", "3:a+", "4:t", "5:b", "6:b+", "7:b+"]);
  });
  it("evento de outro dia que termina hoje pinta desde as 07:00; sem fim vale 30 min", () => {
    const g = encaixarCompromissos(montarGrade([], true), [ev("a", "2026-10-20T22:00", `${dia}T08:00`), ev("b", `${dia}T12:00`)], dia);
    expect(onde(g)).toEqual(["0:a", "1:a+", "10:b"]);
  });
  it("separa dia inteiro (faixa) do que cai todo fora de 07:00 às 22:30 (só agenda da direita)", () => {
    const dias = ev("d", dia, undefined, { diaInteiro: true }), cedo = ev("c", `${dia}T05:00`, `${dia}T06:30`), tarde = ev("t", `${dia}T22:30`, `${dia}T23:00`), borda = ev("b", `${dia}T22:00`, `${dia}T23:00`);
    expect(separarCompromissos([dias, cedo, tarde, borda], dia)).toEqual({ faixa: [dias], horas: [borda] });
  });
  it("esconde o compromisso que já foi digitado: mesmo dia, até 30 min de diferença e título parecido", () => {
    const e = ev("Reunião com a Beec", `${dia}T11:15`, `${dia}T12:00`);
    const tarefa = (titulo: string, inicio: string) => ({ ...t("x", inicio), titulo });
    expect(jaTemTarefa(e, [tarefa("reuniao beec", `${dia}T11:00`)])).toBe(true);
    expect(jaTemTarefa(e, [tarefa("Reunião com a Beec", `${dia}T13:00`)])).toBe(false);
    expect(jaTemTarefa(e, [tarefa("Ligar para o contador", `${dia}T11:00`)])).toBe(false);
    expect(jaTemTarefa(ev("Feriado", dia, undefined, { diaInteiro: true }), [tarefa("Feriado", dia)])).toBe(true);
    expect(titulosParecidos("Reunião com a Beec", "Reunião deodato")).toBe(false);
  });
});
