import { describe, expect, it } from "vitest";
import { arvoreDePastas, pastasLivresDaEmpresa, venceEm } from "./arvore";
import type { DocumentoSolto, Ocasiao, PastaLivre } from "./drive";
import type { Tarefa } from "./tipos";

const drive = (id: string) => ({ id, nome: `${id}.pdf`, tipo: "documento" as const, driveId: `d-${id}` });
const card = (id: string, extra: Partial<Tarefa> = {}): Tarefa => ({
  id, titulo: `Card ${id}`, tipo: "postagem", empresaId: "you", responsavel: "natham", diaInteiro: false, cor: "etiqueta-1", links: [],
  etapa: "edicao", formato: "reels", arquivos: [drive(id)], ...extra,
});
const tema = (id: string, nome: string, extra: Partial<Ocasiao> = {}): Ocasiao => ({ id, empresaId: "you", nome, permanente: false, ...extra });
const arvore = (tarefas: Tarefa[], ocasioes: Ocasiao[] = [], documentos: DocumentoSolto[] = [], empresaId = "you") => arvoreDePastas({ empresaId, tarefas, ocasioes, documentos });
const formato = (a: ReturnType<typeof arvore>, nome: string) => a.find((f) => f.nome === nome)!;

describe("arvoreDePastas: o que aparece e onde", () => {
  it("Empresa → Formato → Tema → conteúdo; os 4 formatos sempre existem, 'Sem formato' só com conteúdo", () => {
    const a = arvore([card("1", { ocasiaoId: "t1" })], [tema("t1", "Reunião de outubro")]);
    expect(a.map((f) => f.nome)).toEqual(["Reels", "Carrossel", "Post", "Stories"]);
    const t = formato(a, "Reels").temas[0];
    expect(t).toMatchObject({ nome: "Reunião de outubro", vazio: false, permanente: false });
    expect(t.conteudos[0].nome).toBe("Reels Reunião de outubro - Card 1"); // nome da pasta no Drive
    expect(arvore([card("2", { formato: undefined })]).map((f) => f.nome)).toContain("Sem formato");
  });
  it("sem tema → pasta 'Sem tema' (sem cadeado), no fim da lista", () => {
    const a = arvore([card("1"), card("2", { ocasiaoId: "t1" })], [tema("t1", "Zebra")]);
    expect(formato(a, "Reels").temas.map((t) => t.nome)).toEqual(["Zebra", "Sem tema"]);
    expect(formato(a, "Reels").temas[1]).toMatchObject({ ocasiao: undefined, permanente: false });
  });
  it("card sem empresa, de outra empresa ou sem arquivo no Drive NÃO aparece", () => {
    const antigo = card("3", { arquivos: [{ id: "x", nome: "velho.png", tipo: "imagem", caminho: "tarefas/3/velho.png" }] }); // anexo antigo do Supabase: só na ficha
    const a = arvore([card("1", { empresaId: "" }), card("2", { empresaId: "beec" }), antigo, card("4", { arquivos: [] })]);
    expect(a.flatMap((f) => f.temas)).toHaveLength(0);
  });
  it("7 dias: conteúdo Postado com arquivo aparece e diz quando vence; sem arquivo (já limpo) some da tela", () => {
    const postado = card("1", { etapa: "postado", postarEm: "2026-10-18T18:00" });
    const limpo = card("2", { etapa: "postado", postarEm: "2026-10-10T18:00", arquivos: [] });
    const a = arvore([postado, limpo]);
    const conteudos = formato(a, "Reels").temas.flatMap((t) => t.conteudos);
    expect(conteudos.map((c) => c.tarefa.id)).toEqual(["1"]);
    expect(conteudos[0].venceEm).toEqual(new Date("2026-10-25T18:00:00-03:00"));
  });
  it("venceEm: usa a última rede postada; só vale em Postado; Permanente não vence; desligar recomeça os 7 dias", () => {
    const base = card("1", { etapa: "postado", postarEm: "2026-10-18T18:00", postagens: [{ rede: "instagram", status: "postado", postadoEm: "2026-10-18T21:00:00Z" }, { rede: "facebook", status: "postado", postadoEm: "2026-10-18T21:05:00Z" }] });
    expect(venceEm(base)).toEqual(new Date("2026-10-25T21:05:00Z"));
    expect(venceEm({ ...base, etapa: "aprovado" })).toBeUndefined();
    expect(venceEm(base, { permanente: true })).toBeUndefined();
    expect(venceEm(base, { permanente: false, desligadoEm: "2026-10-22T12:00:00Z" })).toEqual(new Date("2026-10-29T12:00:00Z"));
    expect(venceEm(base, { permanente: false, desligadoEm: "2026-10-01T12:00:00Z" })).toEqual(new Date("2026-10-25T21:05:00Z")); // desligado há muito: vale o post
    expect(venceEm(card("2", { etapa: "postado" }))).toBeUndefined(); // sem data nenhuma, não inventa
  });
  it("tema permanente: conteúdo Postado continua na tela e não tem data de vencer", () => {
    const a = arvore([card("1", { etapa: "postado", postarEm: "2026-10-01T18:00", ocasiaoId: "t1" })], [tema("t1", "Reunião", { permanente: true })]);
    const t = formato(a, "Reels").temas[0];
    expect(t.permanente).toBe(true);
    expect(t.conteudos[0].venceEm).toBeUndefined();
  });
  it("tema sem nada em lugar nenhum aparece (vazio) em cada formato; assim que tem conteúdo só aparece onde ele está", () => {
    const vazio = arvore([], [tema("t1", "Natal")]);
    expect(["Reels", "Carrossel", "Post", "Stories"].every((f) => formato(vazio, f).temas[0]?.vazio)).toBe(true);
    const usado = arvore([card("1", { ocasiaoId: "t1" })], [tema("t1", "Natal")]);
    expect(formato(usado, "Reels").temas[0].vazio).toBe(false);
    expect(formato(usado, "Post").temas).toHaveLength(0);
  });
  it("documentos soltos entram na pasta do formato e tema deles (e criam a pasta, mesmo sem conteúdo)", () => {
    const doc: DocumentoSolto = { id: "d1", nome: "roteiro.pdf", tipo: "documento", driveId: "x", empresaId: "you", formato: "carrossel", ocasiaoId: "t1" };
    const solto: DocumentoSolto = { id: "d2", nome: "marca.png", tipo: "imagem", driveId: "y", empresaId: "you" };
    const a = arvore([], [tema("t1", "Natal")], [doc, solto, { ...doc, id: "d3", empresaId: "beec" }]);
    expect(formato(a, "Carrossel").temas[0]).toMatchObject({ nome: "Natal", vazio: false });
    expect(formato(a, "Carrossel").temas[0].documentos.map((d) => d.id)).toEqual(["d1"]);
    expect(formato(a, "Sem formato").temas[0]).toMatchObject({ nome: "Sem tema" });
    expect(formato(a, "Sem formato").temas[0].documentos.map((d) => d.id)).toEqual(["d2"]); // a da Beec fica fora
  });
  it("conteúdo cujo tema sumiu do banco cai em 'Sem tema' (não desaparece)", () => {
    const a = arvore([card("1", { ocasiaoId: "apagado" })]);
    expect(formato(a, "Reels").temas[0]).toMatchObject({ nome: "Sem tema" });
    expect(formato(a, "Reels").temas[0].conteudos).toHaveLength(1);
  });
  it("ordem: temas por nome (pt-BR), conteúdos pela data", () => {
    const a = arvore(
      [card("b", { ocasiaoId: "t1", inicio: "2026-10-22T10:00" }), card("a", { ocasiaoId: "t1", inicio: "2026-10-20T10:00" }), card("c", { ocasiaoId: "t2" })],
      [tema("t1", "Zé"), tema("t2", "Ágata")],
    );
    expect(formato(a, "Reels").temas.map((t) => t.nome)).toEqual(["Ágata", "Zé"]);
    expect(formato(a, "Reels").temas[1].conteudos.map((c) => c.tarefa.id)).toEqual(["a", "b"]);
  });
});

describe("pastas livres (234)", () => {
  const pasta = (id: string, nome: string, extra: Partial<PastaLivre> = {}): PastaLivre => ({ id, empresaId: "you", nome, permanente: false, ...extra });
  const doc = (id: string, extra: Partial<DocumentoSolto> = {}): DocumentoSolto => ({ id, nome: `${id}.pdf`, tipo: "documento", driveId: `d-${id}`, empresaId: "you", ...extra });
  it("lista por nome (pt-BR), só da empresa, com os arquivos de cada uma; com cadeado ou sem, nenhum arquivo tem data de sumir", () => {
    const r = pastasLivresDaEmpresa({
      empresaId: "you",
      pastas: [pasta("p2", "Referências"), pasta("p1", "Logos e marca", { permanente: true }), { ...pasta("p3", "Da Beec"), empresaId: "beec" }, pasta("p4", "Álbum")],
      documentos: [doc("a", { pastaLivreId: "p1" }), doc("b", { pastaLivreId: "p2" }), doc("c", { pastaLivreId: "p1" }), doc("d", { pastaLivreId: "p3", empresaId: "beec" })],
    });
    expect(r.map((x) => x.pasta.nome)).toEqual(["Álbum", "Logos e marca", "Referências"]);
    expect(r[1].pasta.permanente).toBe(true);
    expect(r[1].documentos.map((d) => d.id)).toEqual(["a", "c"]);
    expect(r[0].documentos).toEqual([]); // pasta vazia aparece
  });
  it("arquivo de pasta livre NÃO cai em 'Sem formato / Sem tema' da árvore dos posts", () => {
    const a = arvore([], [], [doc("a", { pastaLivreId: "p1" })]);
    expect(a.map((f) => f.nome)).toEqual(["Reels", "Carrossel", "Post", "Stories"]);
    expect(a.flatMap((f) => f.temas)).toHaveLength(0);
  });
});

