import { describe, expect, it } from "vitest";
import { criarPasta, excluirPasta, lerPastas, nomeEmUso, renomearPasta } from "./pastas";

const nomes = (e: string) => lerPastas(e).map((p) => p.nome);

describe("pastas", () => {
  it("cria vazia só naquela empresa, renomeia e exclui", () => {
    criarPasta("beec", "Teste");
    expect(nomes("beec")).toEqual(["Posts", "Carrosséis", "Vídeos", "Stories", "Teste", "Ideias de conteúdo"]); // Ideias sempre por último
    const nova = lerPastas("beec").find((p) => p.nome === "Teste")!;
    expect(nova.tipo).toBeUndefined();
    expect(nomes("you")).not.toContain("Teste");
    renomearPasta("beec", nova.id, " Teste 2 ");
    expect(nomes("beec")).toContain("Teste 2");
    expect(nomeEmUso(lerPastas("beec"), "teste 2")).toBe(true);
    expect(nomeEmUso(lerPastas("beec"), "teste 2", nova.id)).toBe(false);
    excluirPasta("beec", nova.id);
    expect(nomes("beec")).toEqual(["Posts", "Carrosséis", "Vídeos", "Stories", "Ideias de conteúdo"]);
  });
});
