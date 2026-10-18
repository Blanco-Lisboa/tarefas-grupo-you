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

describe("concluida", () => {
  it("marca só algumas tarefas antigas", () => {
    const feitas = tarefasExemplo.filter((t) => t.concluida);
    expect(feitas.length).toBeGreaterThanOrEqual(3);
    expect(feitas.length).toBeLessThanOrEqual(4);
  });
});
