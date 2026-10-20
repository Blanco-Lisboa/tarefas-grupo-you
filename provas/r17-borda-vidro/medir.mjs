// Item 180b: mede miolo vs borda e fotografa o card do Mapa (1903/1440/390), com zoom na borda de baixo.
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
  await p.goto("http://127.0.0.1:3199/mapa", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
  const card = p.locator(".borda-animada").first();
  await card.scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  const r = await card.evaluate((el) => { const q = (e) => { const b = e.getBoundingClientRect(); return { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2), bottom: +b.bottom.toFixed(2) }; }; const m = el.querySelector(".mapa-card"); return { borda: q(el), miolo: q(m), paddingBorda: getComputedStyle(el).padding, alturaMioloCSS: getComputedStyle(m).height, scrollH: m.scrollHeight, clientH: m.clientHeight }; });
  console.log(w, JSON.stringify(r));
  const c = await card.boundingBox(); const m = 24;
  await p.screenshot({ path: join(PASTA, `card-${w}.png`), clip: { x: Math.max(0, c.x - m), y: Math.max(0, c.y - m), width: c.width + 2 * m, height: c.height + 2 * m } });
  await p.screenshot({ path: join(PASTA, `zoom-baixo-${w}.png`), clip: { x: Math.max(0, c.x - 6), y: c.y + c.height - 14, width: Math.min(c.width + 12, 120), height: 24 } });
  await ctx.close();
}
await nav.close();
