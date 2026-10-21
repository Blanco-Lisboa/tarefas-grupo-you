import { describe, expect, it } from "vitest";
import type { Tarefa } from "@/lib/dados";
import { prazo } from "./TelaConteudos";

// 238: com a postagem automática desligada a contagem não promete que o sistema posta.
describe("contagem do card (prazo)", () => {
  const card = (inicio: string) => ({ inicio, etapa: "aprovado", arquivos: [], links: [] }) as unknown as Tarefa;
  it("ligada: hoje / posta amanhã / posta em N dias; desligada: post hoje / post amanhã / post em N dias", () => {
    expect(["2026-10-21", "2026-10-22", "2026-10-26"].map((d) => prazo(card(d), "2026-10-21")?.texto)).toEqual(["hoje", "posta amanhã", "posta em 5 dias"]);
    expect(["2026-10-21", "2026-10-22", "2026-10-26"].map((d) => prazo(card(d), "2026-10-21", false)?.texto)).toEqual(["post hoje", "post amanhã", "post em 5 dias"]);
  });
});
