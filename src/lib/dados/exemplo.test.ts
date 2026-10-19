import { describe, expect, it } from "vitest";
import { empresasExemplo, tarefasExemplo } from "./exemplo";
import { ETIQUETAS } from "./tipos";

const HOJE = "2026-10-19";
const conteudos = tarefasExemplo.filter((t) => t.etapa);

describe("dados de exemplo", () => {
  it("têm ids únicos, empresas e etiquetas válidas", () => {
    expect(new Set(tarefasExemplo.map((t) => t.id)).size).toBe(tarefasExemplo.length);
    const empresas = empresasExemplo.map((e) => e.id);
    for (const t of tarefasExemplo) {
      expect(empresas).toContain(t.empresaId);
      expect(ETIQUETAS).toContain(t.cor);
    }
  });

  it("têm tarefa sem data, títulos únicos e travessão nenhum", () => {
    expect(tarefasExemplo.some((t) => !t.inicio)).toBe(true);
    expect(new Set(tarefasExemplo.map((t) => t.titulo)).size).toBe(tarefasExemplo.length);
    expect(JSON.stringify(tarefasExemplo)).not.toMatch(/[—–]/);
  });

  it("todo título é curto (o cartão do Mapa só mostra ele)", () => {
    for (const t of tarefasExemplo) expect(t.titulo.length, t.titulo).toBeLessThanOrEqual(60);
  });
});

describe("conteúdos do Kanban", () => {
  const etapas = ["roteiro", "gravacao", "edicao", "analise", "aprovado", "postado"] as const;

  it("têm 3 por etapa e nenhum em Ideia", () => {
    for (const e of etapas) expect(conteudos.filter((t) => t.etapa === e).length, e).toBe(3);
    expect(conteudos.length).toBe(18);
  });

  it("misturam empresas, responsáveis e redes", () => {
    expect(new Set(conteudos.map((t) => t.empresaId)).size).toBe(empresasExemplo.length);
    expect(new Set(conteudos.map((t) => t.responsavel)).size).toBe(2);
    expect(new Set(conteudos.map((t) => t.rede)).size).toBe(4);
  });

  it("cada etapa aberta tem 1 atrasado, 1 hoje/amanhã e 1 mais à frente; Postado fica no passado", () => {
    const dia = (t: { inicio?: string }) => t.inicio!.slice(0, 10);
    for (const e of etapas.slice(0, 5)) {
      const l = conteudos.filter((t) => t.etapa === e);
      expect(l.filter((t) => dia(t) < HOJE).length, `${e} atrasado`).toBe(1);
      expect(l.filter((t) => dia(t) === HOJE || dia(t) === "2026-10-20").length, `${e} hoje/amanhã`).toBe(1);
      expect(l.filter((t) => dia(t) > "2026-10-20").length, `${e} à frente`).toBe(1);
    }
    for (const t of conteudos.filter((c) => c.etapa === "postado")) expect(dia(t) < HOJE).toBe(true);
  });

  it("têm 1 conteúdo hoje com horário", () => {
    expect(conteudos.filter((t) => t.inicio?.startsWith(`${HOJE}T`)).length).toBe(1);
  });
});
