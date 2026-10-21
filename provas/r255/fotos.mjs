// Itens 249-252: fotos do mural de ideias antes (3471, build do commit anterior) e depois (3472), com a prova da rolagem.
// Precisa do banco-falso (provas/vitral-213/banco-falso.mjs, porta 3299) e dos dois apps no ar. Uso: node provas/r255/fotos.mjs
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
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const marca = (p) => p.evaluate(() => { document.getElementById("marca-iw")?.remove(); const d = document.createElement("div"); d.id = "marca-iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
const linhas = [];
import { writeFileSync, readFileSync } from "node:fs";
for (const [w, h] of [[1903, 900], [1440, 760]]) {
  const topos = {};
  for (const [nome, porta] of [["antes", 3471], ["depois", 3472]]) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
    const p = await ctx.newPage();
    await p.goto(`http://127.0.0.1:${porta}/conteudos`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    await marca(p);
    await p.screenshot({ path: join(PASTA, `esteira-${nome}-${w}.png`) });
    const sel = nome === "antes" ? ".conteudos-coluna-topo" : ".cab-coluna";
    const caixas = await p.locator(sel).evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); const h2 = getComputedStyle(e.querySelector("h2")); return [r.x, r.y, r.width, r.height, c.paddingLeft, c.borderLeftWidth, c.gap, h2.fontSize, h2.fontWeight, h2.whiteSpace, h2.overflow, h2.minWidth].join(","); }));
    topos[nome] = caixas;
    const lista = p.locator(sel);
    const n = await lista.count();
    for (let i = 0; i < n; i++) await lista.nth(i).screenshot({ path: join(PASTA, `esteira-topo-${nome}-${w}-${i + 1}.png`) });
    await ctx.close();
  }
  let iguais = JSON.stringify(topos.antes) === JSON.stringify(topos.depois);
  for (let i = 1; i <= topos.antes.length; i++) {
    const x = readFileSync(join(PASTA, `esteira-topo-antes-${w}-${i}.png`)), y = readFileSync(join(PASTA, `esteira-topo-depois-${w}-${i}.png`));
    if (!x.equals(y)) iguais = false;
  }
  linhas.push(`Esteira ${w}: ${topos.antes.length} cabeçalhos, medidas e pixels dos cabeçalhos ${iguais ? "IGUAIS" : "DIFERENTES"}`);
}
// Mural: lixeira e título longo
for (const [w, h] of [[1903, 900], [1440, 760]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
  const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:3472/pastas", { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await p.locator(".pastas-cel", { hasText: "Ideias de conteúdo" }).locator(".gf-hit").first().click();
  await p.waitForSelector("dialog.mural[open]");
  await p.waitForTimeout(900);
  await marca(p);
  await p.screenshot({ path: join(PASTA, `mural-${w}.png`) });
  const col = p.locator(".mural-col").first();
  const cab = await col.locator(".cab-coluna h2").evaluate((e) => ({ sw: e.scrollWidth, cw: e.clientWidth, sh: e.scrollHeight, ch: e.clientHeight }));
  linhas.push(`Mural ${w}: título 'Formatos de conteúdo' scrollWidth ${cab.sw} clientWidth ${cab.cw} scrollHeight ${cab.sh} clientHeight ${cab.ch} (sem corte se iguais)`);
  if (w === 1440) {
    const folha = col.locator(".mural-folha:not(.mural-nova)").first();
    await folha.hover();
    await folha.locator("textarea.mural-titulo").click();
    await p.waitForTimeout(400);
    await folha.screenshot({ path: join(PASTA, "mural-card-editando-titulo.png") });
    const t = await folha.locator("textarea.mural-titulo").boundingBox(), l = await folha.locator(".mural-apagar").boundingBox();
    linhas.push(`Mural: borda direita do título ${Math.round(t.x + t.width)} | borda esquerda da lixeira ${Math.round(l.x)} | folga ${Math.round(l.x - (t.x + t.width))}px`);
    await col.screenshot({ path: join(PASTA, "mural-coluna-1.png") });
  }
  await ctx.close();
}
await nav.close();
writeFileSync(join(PASTA, "resultado.txt"), linhas.join("\n") + "\n");
console.log(linhas.join("\n"));
