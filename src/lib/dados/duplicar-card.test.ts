import { describe, expect, it } from "vitest";
import { duplicarCard, tituloDaCopia } from "./duplicar-card";
import type { Tag, Tarefa } from "./tipos";

const base = { id: "a", titulo: "Reunião X", tipo: "postagem", empresaId: "you", etapa: "postado", responsavel: "natham", diaInteiro: false, cor: "etiqueta-3",
  links: [{ rotulo: "Drive", url: "https://drive.google.com/x" }], arquivos: [{ nome: "v.mp4" }], tags: ["t1", "ap"], aprovador: "Matheus", postarEm: "2026-10-30T10:00", postadoEm: "2026-10-30T10:01",
  notas: "roteiro", objetivo: "vender", formato: "reels", legenda: "oi", ocasiaoId: "tema1" } as Tarefa;
const tags: Tag[] = [{ id: "t1", nome: "Urgente", cor: "etiqueta-7" }, { id: "ap", nome: "Esperando aprovação", cor: "etiqueta-1", aprovacao: true }];

describe("duplicar card (310)", () => {
  it("numera a partir da base, também ao duplicar uma cópia", () => {
    const t = (titulo: string) => ({ titulo, empresaId: "you" });
    expect(tituloDaCopia("Reunião X", [t("Reunião X")], "you")).toBe("Reunião X - Cópia 1");
    expect(tituloDaCopia("Reunião X", [t("Reunião X"), t("Reunião X - Cópia 1")], "you")).toBe("Reunião X - Cópia 2");
    expect(tituloDaCopia("Reunião X - Cópia 1", [t("Reunião X"), t("Reunião X - Cópia 1"), t("Reunião X - Cópia 2")], "you")).toBe("Reunião X - Cópia 3");
    expect(tituloDaCopia("Reunião X", [{ titulo: "Reunião X - Cópia 5", empresaId: "beec" }], "you")).toBe("Reunião X - Cópia 1");
  });
  it("copia o planejamento e deixa de fora anexo, Drive, aprovação e postagem; Postado volta ao Roteiro", () => {
    const c = duplicarCard(base, [base], tags);
    expect(c).toMatchObject({ titulo: "Reunião X - Cópia 1", etapa: "roteiro", empresaId: "you", formato: "reels", notas: "roteiro", objetivo: "vender", ocasiaoId: "tema1", tags: ["t1"], links: [], arquivos: [] });
    expect(c.id).toBeUndefined();
    expect(c.aprovador).toBeUndefined();
    expect(c.postarEm).toBeUndefined();
    expect(c.postadoEm).toBeUndefined();
    expect(c.legenda).toBeUndefined();
  });
  it("etapa que não é Aprovado/Postado fica onde está", () => {
    expect(duplicarCard({ ...base, etapa: "edicao" }, [base], tags).etapa).toBe("edicao");
  });
});
