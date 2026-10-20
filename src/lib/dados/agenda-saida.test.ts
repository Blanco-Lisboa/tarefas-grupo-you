import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// A volta da agenda (010) tem três pontas que precisam dizer a mesma coisa: coluna do banco, parâmetro da função e campo do brief do n8n.
const sql = readFileSync("supabase/010_agenda_saida_tarefas_para_o_google.sql", "utf8");
const brief = readFileSync("docs/levas/2026-10-21-N8N-AGENDA-BRIEF.md", "utf8");

describe("010 x brief do n8n", () => {
  it("as funções e os parâmetros do banco aparecem iguais no brief", () => {
    for (const nome of ["agenda_saida_pendentes", "agenda_saida_confirmar", "p_limite", "p_id", "p_google_event_id", "p_erro"]) {
      expect(sql, nome).toContain(nome);
      expect(brief, nome).toContain(nome);
    }
  });
  it("os campos que o banco entrega estão todos descritos no brief", () => {
    const entrega = sql.match(/jsonb_build_object\('id', r\.id, 'acao'.*\)/)?.[0] + (sql.match(/jsonb_build_object\('titulo'.*\)/)?.[0] ?? "");
    const campos = [...entrega.matchAll(/'([a-z_]+)',/g)].map((m) => m[1]);
    expect(campos).toEqual(expect.arrayContaining(["id", "acao", "tarefa_id", "calendar_id", "google_event_id", "titulo", "inicio", "fim", "dia_inteiro", "fuso"]));
    for (const c of campos) expect(brief, c).toContain(`\`${c}\``);
  });
  it("a marca que evita loop é a mesma nos dois lados", () => {
    expect(brief).toContain("extendedProperties.private.tarefa_id");
    expect(sql).toMatch(/e->>'tarefa_id'/);
  });
  it("criar usa id fixo por tarefa e o brief manda tratar 409 como já existe (R5-2)", () => {
    expect(sql).toContain("replace(r.tarefa_id::text, '-', '')");
    expect(brief).toContain("409");
    expect(brief).toMatch(/`PUT \/calendars/);
  });
  it("regra só eu escrevo no banco e no brief; IDA só depois do 010 (R5-3, R5-4)", () => {
    expect(sql).toContain("private.pode_ir_pro_google");
    expect(brief).toContain("só eu escrevo");
    expect(brief).toContain("010 aplicado");
    expect(brief).not.toMatch(/aplica o arquivo `supabase\/008/);
  });
  it("tabelas da fila ficam fechadas para quem está logado", () => {
    expect(sql).toMatch(/revoke all on public\.agenda_pessoa, public\.agenda_saida, public\.agenda_saida_vinculo from public, anon, authenticated/);
    expect(sql).not.toMatch(/eyJ|sb_secret_/);
  });
});
