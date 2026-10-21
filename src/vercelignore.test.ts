// 244 · O que vai para a Vercel é o que o .vercelignore deixa passar. A montagem falhou porque src/ importava um arquivo de supabase/ que o .vercelignore cortava.
// Este teste olha TODO import relativo de src/ que sai de src/ e exige que o arquivo (e as pastas até ele) NÃO sejam cortados.
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import ignore from "ignore";
import { describe, expect, it } from "vitest";

const raiz = resolve(__dirname, "..");
const regras = ignore().add(readFileSync(join(raiz, ".vercelignore"), "utf8"));
const vai = (caminho: string) => {
  const rel = relative(raiz, caminho).split(sep).join("/");
  const pastas = rel.split("/").slice(0, -1).map((_, i, a) => `${a.slice(0, i + 1).join("/")}/`); // a CLI não entra em pasta cortada
  return !pastas.some((p) => regras.ignores(p)) && !regras.ignores(rel);
};
const arquivos = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const c = join(dir, n); return statSync(c).isDirectory() ? arquivos(c) : /\.(tsx?|css)$/.test(n) ? [c] : []; });
const EXT = ["", ".ts", ".tsx", ".js", ".mjs", ".css", "/index.ts", "/index.tsx"];
const resolver = (de: string, alvo: string) => EXT.map((e) => resolve(dirname(de), alvo + e)).find((c) => existsSync(c) && statSync(c).isFile());

describe("244: o .vercelignore não corta nada que a montagem precisa", () => {
  const src = join(raiz, "src");
  const importsDeFora = arquivos(src).filter((f) => !/\.test\.tsx?$/.test(f)).flatMap((f) =>
    [...readFileSync(f, "utf8").matchAll(/(?:from|import)\s*\(?\s*["'](\.{1,2}\/[^"']+)["']/g)]
      .map((m) => ({ de: f, alvo: resolver(f, m[1]) }))
      .filter((x): x is { de: string; alvo: string } => !!x.alvo && relative(src, x.alvo).startsWith("..")));
  it("todo arquivo importado de fora de src/ (ex.: supabase/functions/_shared/pastas.ts) vai para a Vercel", () => {
    expect(importsDeFora.length).toBeGreaterThan(0); // hoje: arvore.ts importa _shared/pastas.ts
    for (const { de, alvo } of importsDeFora) expect({ de: relative(raiz, de), alvo: relative(raiz, alvo), vai: vai(alvo) }).toMatchObject({ vai: true });
  });
  it("e o resto de supabase/, docs, provas e segredos continua fora do envio", () => {
    for (const fora of ["supabase/019_postagem_drive.sql", "supabase/functions/drive/acoes.ts", "supabase/functions/postar-meta/estado.ts", "supabase/_colar/022-tags-trava.sql", "supabase/functions/_shared/google.ts", "docs/levas/x.md", "provas/x.png", ".env.local"])
      expect({ fora, vai: vai(join(raiz, fora)) }).toEqual({ fora, vai: false });
    expect(vai(join(raiz, "supabase/functions/_shared/pastas.ts"))).toBe(true);
    expect(vai(join(raiz, "src/app/page.tsx"))).toBe(true);
  });
});
