import { describe, expect, it } from "vitest";
import { criarPasta, excluirPasta, lerPastas, nomeEmUso, renomearPasta } from "./pastas";

describe("pastas", () => {
  it("cria vazia só naquela empresa, renomeia e exclui", () => {
    criarPasta("beec", "Teste");
    expect(lerPastas("beec").at(-1)!.nome).toBe("Teste");
    expect(lerPastas("beec").at(-1)!.tipo).toBeUndefined();
    expect(lerPastas("you").map((p) => p.nome)).not.toContain("Teste");
    const id = lerPastas("beec").at(-1)!.id;
    renomearPasta("beec", id, " Teste 2 ");
    expect(lerPastas("beec").at(-1)!.nome).toBe("Teste 2");
    expect(nomeEmUso(lerPastas("beec"), "teste 2")).toBe(true);
    expect(nomeEmUso(lerPastas("beec"), "teste 2", id)).toBe(false);
    excluirPasta("beec", id);
    expect(lerPastas("beec").map((p) => p.nome)).toEqual(["Posts", "Carrosséis", "Vídeos", "Stories"]);
  });
});
