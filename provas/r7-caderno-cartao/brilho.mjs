// Item 157: brilho correndo no item ativo do menu. 3 fotos do menu em momentos diferentes + posição do fundo medida.
// Mesmo arranjo do fotos.mjs (banco-falso.mjs + app em 3199). Uso: node provas/r7-caderno-cartao/brilho.mjs
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
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
  const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:3199/conteudos", { waitUntil: "networkidle" });
  await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
  const ativo = p.locator('.menu-item[aria-current="page"]');
  const menu = p.locator(".menu");
  for (const k of [0, 1, 2]) {
    await p.waitForTimeout(700);
    console.log(w, "quadro", k, "fundo em", await ativo.evaluate((e) => getComputedStyle(e).backgroundPosition), "| animação:", await ativo.evaluate((e) => getComputedStyle(e).animationName));
    await menu.screenshot({ path: join(PASTA, `brilho-${w}-${k}.png`) });
  }
  await ctx.close();
}
await nav.close();
