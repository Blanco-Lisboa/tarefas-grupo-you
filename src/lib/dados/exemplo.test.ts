import { describe, expect, it } from "vitest";
import { empresasExemplo, tarefasExemplo } from "./exemplo";
import { ETIQUETAS } from "./tipos";

describe("dados de exemplo", () => {
  it("têm cerca de 40 tarefas, ids únicos, empresas e etiquetas válidas", () => {
    expect(tarefasExemplo.length).toBeGreaterThanOrEqual(40);
    expect(new Set(tarefasExemplo.map((t) => t.id)).size).toBe(tarefasExemplo.length);
    const empresas = empresasExemplo.map((e) => e.id);
    for (const t of tarefasExemplo) {
      expect(empresas).toContain(t.empresaId);
      expect(ETIQUETAS).toContain(t.cor);
    }
  });

  it("têm tarefas sem data e travessão nenhum", () => {
    expect(tarefasExemplo.some((t) => !t.inicio)).toBe(true);
    expect(JSON.stringify(tarefasExemplo)).not.toMatch(/[—–]/);
  });
});

describe("postagens do Mapa", () => {
  const post = tarefasExemplo.filter((t) => t.tipo === "postagem" && t.inicio);
  const dias = (de: string, ate: string) => {
    const l: string[] = [];
    for (let d = new Date(`${de}T00:00:00Z`); d <= new Date(`${ate}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) l.push(d.toISOString().slice(0, 10));
    return l;
  };

  it("têm conteúdo em TODOS os dias de 01/10 a 30/11, de 1 a 3 por dia", () => {
    for (const d of dias("2026-10-01", "2026-11-30")) {
      const n = post.filter((t) => t.inicio!.startsWith(d)).length;
      expect(n, d).toBeGreaterThanOrEqual(1);
      expect(n, d).toBeLessThanOrEqual(3);
    }
  });

  it("todo conteúdo tem título curto (é só ele que o cartão do Mapa mostra)", () => {
    for (const t of post) {
      expect(t.titulo.trim().length, t.id).toBeGreaterThan(0);
      expect(t.titulo.length, t.titulo).toBeLessThanOrEqual(60);
    }
  });

  it("não repetem título", () => {
    const titulos = tarefasExemplo.map((t) => t.titulo);
    expect(new Set(titulos).size).toBe(titulos.length);
  });

  it("misturam as empresas, as redes e as etapas", () => {
    expect(new Set(post.map((t) => t.empresaId)).size).toBe(empresasExemplo.length);
    expect(new Set(post.map((t) => t.rede)).size).toBeGreaterThanOrEqual(4);
    for (const e of ["roteiro", "gravacao", "edicao", "aprovado", "postado"]) expect(post.some((t) => t.etapa === e), e).toBe(true);
  });
});

describe("concluida", () => {
  it("marca só algumas tarefas antigas", () => {
    const feitas = tarefasExemplo.filter((t) => t.concluida);
    expect(feitas.length).toBeGreaterThanOrEqual(3);
    expect(feitas.length).toBeLessThanOrEqual(4);
  });
});
