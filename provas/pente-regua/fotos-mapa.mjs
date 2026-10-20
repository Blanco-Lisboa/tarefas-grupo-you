// Fotos do Mapa (item 176): Linha (20/10 com 3 conteúdos, 24/10 com 1) fechado e com leque, Fila, e Pastas para comparar. Cookie de sessão de mentira.
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
const marca = (p) => p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:70px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
  const p = await ctx.newPage(); const erros = []; p.on("pageerror", (e) => erros.push(e.message)); p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  await p.goto("http://127.0.0.1:3199/mapa", { waitUntil: "networkidle" }); await marca(p);
  for (const dia of ["2026-10-20", "2026-10-22"]) {
    const m = p.locator(`[data-marco][data-dia="${dia}"]`);
    await m.evaluate((e) => e.scrollIntoView({ inline: "center", block: "nearest" })); await p.waitForTimeout(500);
    const info = await m.evaluate((e) => { const r = e.getBoundingClientRect(); return { dir: Math.round(innerWidth - r.right), n: e.querySelectorAll(".mapa-card").length }; });
    console.log(w, dia, JSON.stringify(info));
    await p.screenshot({ path: join(PASTA, `mapa-${dia.slice(8)}-${w}.png`) });
    await m.locator(".mapa-bloco").screenshot({ path: join(PASTA, `zoom-${dia.slice(8)}-${w}.png`) });
    await m.locator(".mapa-pilha").hover(); await p.waitForTimeout(600);
    await m.locator(".mapa-bloco").screenshot({ path: join(PASTA, `zoom-${dia.slice(8)}-${w}-aberto.png`) });
    await p.mouse.move(0, 0);
  }
  await p.getByRole("button", { name: "Fila" }).click(); await p.waitForTimeout(500);
  await p.screenshot({ path: join(PASTA, `fila-${w}.png`) });
  await p.goto("http://127.0.0.1:3199/pastas", { waitUntil: "networkidle" }); await marca(p);
  await p.screenshot({ path: join(PASTA, `pastas-${w}.png`) });
  console.log(w, "erros:", JSON.stringify(erros));
  await ctx.close();
}
await nav.close();
