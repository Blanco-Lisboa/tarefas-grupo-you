import { describe, expect, it } from "vitest";
import { chaves, MINUTOS_PARA_LIMPAR, nomeFormato, nomePastaConteudo } from "./pastas.ts";

describe("pastas: nome e chave", () => {
  it("nome da pasta do conteúdo: <Formato> <tema> - <título>", () => {
    expect(nomePastaConteudo("reels", "Reunião de outubro", "Bastidores da You")).toBe("Reels Reunião de outubro - Bastidores da You");
    expect(nomePastaConteudo("carrossel", "Natal", "5 dicas")).toBe("Carrossel Natal - 5 dicas");
    expect(nomePastaConteudo("story", "Natal", "Contagem")).toBe("Stories Natal - Contagem");
  });
  it("sem tema e sem formato", () => {
    expect(nomePastaConteudo("post", null, "Aviso")).toBe("Post - Aviso");
    expect(nomePastaConteudo(null, "Natal", "Aviso")).toBe("Natal - Aviso");
    expect(nomePastaConteudo(undefined, undefined, "Aviso")).toBe("Aviso");
    expect(nomePastaConteudo("formato-que-nao-existe", null, "Aviso")).toBe("Aviso");
  });
  it("espaços repetidos somem, título vazio vira Sem título e o nome tem teto", () => {
    expect(nomePastaConteudo("reels", "  A   B ", "  C   D ")).toBe("Reels A B - C D");
    expect(nomePastaConteudo("reels", null, "   ")).toBe("Reels - Sem título");
    expect(nomePastaConteudo("reels", null, "x".repeat(500)).length).toBe(200);
  });
  it("chaves: formato inválido cai em 'sem'; tema nulo cai em 'sem'", () => {
    expect(chaves.formato("you", "reels")).toBe("formato:you:reels");
    expect(chaves.formato("you", null)).toBe("formato:you:sem");
    expect(chaves.tema("t1", "you", "post")).toBe("tema:t1:you:post");
    expect(chaves.tema(null, "you", undefined)).toBe("tema:sem:you:sem");
    expect(chaves.conteudo("abc")).toBe("card:abc");
    expect(nomeFormato("story")).toBe("Stories");
    expect(nomeFormato(null)).toBe("Sem formato");
  });
  it("7 dias em minutos (o que o armar_alarme_servico recebe)", () => {
    expect(MINUTOS_PARA_LIMPAR).toBe(10080);
  });
});
