// Item 256: prova da cópia do navegador para o banco e fotos do mural com dados do banco. Precisa de `npm run exemplo` no ar (3101 + banco falso 3201).
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000, uid = "u-natham";
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const ex = (e, n, categoria, titulo) => ({ id: `${e}-ideia-${n}`, empresaId: e, categoria, titulo, texto: "do navegador" });
// O que o Natham teria no navegador: exemplos (2 da You fora de Ganchos), uma ideia dele e colunas novas na Beec.
const navegador = {
  you: [ex("you", 1, "Formatos de conteúdo", "X regras para não perder [TEMA]"), ex("you", 5, "Perfis - Contabilidade", "Você está pagando imposto a mais"), ex("you", 6, "Perfis - Contabilidade", "Ninguém te conta isso sobre [TEMA]"), { id: "22222222-2222-4222-8222-222222222222", empresaId: "you", categoria: "Ideia dele", titulo: "Minha ideia na You", texto: "escrita por ele" }],
  beec: [ex("beec", 1, "Formatos na prática", "Exemplo 1"), { id: "33333333-3333-4333-8333-333333333333", empresaId: "beec", categoria: "Perfis - Empresários sellers", titulo: "Ideia dele na Beec", texto: "" }],
};
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const banco = async (t, q = "") => (await fetch(`http://127.0.0.1:3211/rest/v1/${t}?${q}`)).json();
const resumo = async () => ({ ideias: (await banco("ideias")).length, categorias: (await banco("ideias_categorias")).length });
const antes = await resumo();
const ctx = await nav.newContext({ viewport: { width: 1440, height: 760 } });
await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
await ctx.addInitScript((d) => { if (!localStorage.getItem("grade-conteudo:ideias:v1")) localStorage.setItem("grade-conteudo:ideias:v1", d); }, JSON.stringify(navegador));
const abrir = async () => {
  const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:3111/pastas", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  return p;
};
const p1 = await abrir(), p2 = await abrir(); // duas abas
await p1.waitForTimeout(1000);
const depois = await resumo();
const marcas = await p1.evaluate(() => Object.keys(localStorage).filter((k) => k.includes("subiu")));
const youGanchos = (await banco("ideias", "empresa_id=eq.you")).filter((l) => l.categoria === "Ganchos").map((l) => l.titulo);
const ele = (await banco("ideias")).filter((l) => ["Minha ideia na You", "Ideia dele na Beec"].includes(l.titulo)).length;
const p3 = await abrir(); // reabre
const reaberta = await resumo();
console.log(JSON.stringify({ antes, depoisDeDuasAbas: depois, depoisDeReabrir: reaberta, marcas, ganchosDaYou: youGanchos, ideiasDeleNoBanco: ele }, null, 1));
// foto do mural da You com dados do banco (desta vez sem nada no navegador)
const ctx2 = await nav.newContext({ viewport: { width: 1440, height: 760 } });
await ctx2.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
for (const [w, h] of [[1440, 760], [1903, 900], [390, 844]]) {
  const p = await ctx2.newPage();
  await p.setViewportSize({ width: w, height: h });
  await p.goto("http://127.0.0.1:3111/pastas", { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await p.locator(".pastas-cel", { hasText: "Ideias de conteúdo" }).locator(".gf-hit").first().click();
  await p.waitForSelector("dialog.mural[open]");
  await p.waitForTimeout(800);
  await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
  await p.screenshot({ path: join(PASTA, `mural-banco-${w}.png`) });
  await p.close();
}
await nav.close();
