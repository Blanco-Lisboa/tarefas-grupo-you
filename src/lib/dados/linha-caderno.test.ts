// 292 · Antes do SQL colado a coluna não existe: não pode virar erro na tela.
import { expect, it } from "vitest";
import { colunaAusente } from "./linha-caderno";

it("reconhece o erro de coluna que não existe (Postgres e API)", () => {
  expect(colunaAusente({ code: "42703" })).toBe(true);
  expect(colunaAusente({ code: "PGRST204" })).toBe(true);
  expect(colunaAusente({ code: "42501" })).toBe(false);
  expect(colunaAusente(null)).toBe(false);
});

// 296-fix2 · Nenhum salvar comum (função salvar_tarefa ou o update de reserva) pode reescrever a linha/cor: elas só vão por gravarExtras.
import { paraBanco } from "./repositorio-regras";
import type { Tarefa } from "./tipos";
it("o salvar comum nunca manda linha_caderno nem cor_linha (não apaga nem reescreve)", () => {
  const t = { id: "x", titulo: "t", tipo: "outro", empresaId: "", responsavel: "natham", diaInteiro: false, cor: "etiqueta-5", links: [], arquivos: [], linhaCaderno: 7, corLinha: "azul" } as Tarefa;
  const campos = paraBanco(t, "p-natham");
  expect(Object.keys(campos)).not.toContain("linha_caderno");
  expect(Object.keys(campos)).not.toContain("cor_linha");
});
