// 292 · Antes do SQL colado a coluna não existe: não pode virar erro na tela.
import { expect, it } from "vitest";
import { colunaAusente } from "./linha-caderno";

it("reconhece o erro de coluna que não existe (Postgres e API)", () => {
  expect(colunaAusente({ code: "42703" })).toBe(true);
  expect(colunaAusente({ code: "PGRST204" })).toBe(true);
  expect(colunaAusente({ code: "42501" })).toBe(false);
  expect(colunaAusente(null)).toBe(false);
});
