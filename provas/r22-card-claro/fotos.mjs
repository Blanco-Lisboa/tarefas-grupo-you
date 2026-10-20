// Item 180: card solto do Mapa com borda de luz girando. 2 fotos do mesmo card com 0,5 s de intervalo + posição da luz medida.
// Mesmo arranjo do r14-mapa-vidro/fotos.mjs (banco-falso.mjs + app em 3199). Uso: node provas/r22-card-claro/fotos.mjs
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
for (const reduzido of [false, true]) {
  for (const [w, h] of reduzido ? [[1440, 760]] : [[1903, 900], [1440, 760], [390, 844]]) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, reducedMotion: reduzido ? "reduce" : "no-preference" });
    await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
    const p = await ctx.newPage();
    const erros = [];
    p.on("pageerror", (e) => erros.push(e.message));
    await p.goto("http://127.0.0.1:3199/mapa", { waitUntil: "networkidle" });
    await p.waitForTimeout(800);
    await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
    const card = p.locator(".borda-animada").first();
    await card.scrollIntoViewIfNeeded();
    await p.waitForTimeout(400);
    const c = await card.boundingBox();
    const m = 24;
    const clip = { x: Math.max(0, c.x - m), y: Math.max(0, c.y - m), width: c.width + 2 * m, height: c.height + 2 * m };
    const luz = () => card.locator(".borda-animada-luz").evaluate((e) => getComputedStyle(e).transform);
    const sufixo = reduzido ? "-movimento-reduzido" : "";
    const a = await luz(); await p.screenshot({ path: join(PASTA, `card-${w}${sufixo}-a.png`), clip });
    await p.waitForTimeout(500);
    const b = await luz(); await p.screenshot({ path: join(PASTA, `card-${w}${sufixo}-b.png`), clip });
    console.log(w, reduzido ? "movimento reduzido" : "", "| cards animados:", await p.locator(".borda-animada").count(), "| luz a:", a, "| luz b:", b, "| erros:", erros.length ? erros : "nenhum");
    if (w === 1440 && !reduzido) await p.screenshot({ path: join(PASTA, "mapa-1440.png") });
    await ctx.close();
  }
}
await nav.close();
