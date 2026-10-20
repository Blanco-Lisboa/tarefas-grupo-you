// Item 180e: lista os ancestrais do card do Mapa (caixa + estilos que cortam sombra) e fotografa o card inteiro em 1x.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const rotulo = process.argv[2] || "antes";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000, uid = "u-natham";
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
  const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:3499/mapa", { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  if (rotulo === "antes") await p.addStyleTag({ content: ".mapa-bloco{--ex:0px!important}" }); // reproduz a regra antiga (sem folga)
  await p.addStyleTag({ content: ".borda-animada-luz{animation:none!important}" });
  const card = p.locator(".mapa-pilha > .borda-animada", { hasText: "Post - Reels" }).first();
  await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  if (w === 1903) {
    const r = await card.evaluate((el) => { const out = []; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const b = e.getBoundingClientRect(), s = getComputedStyle(e); out.push({ el: e.tagName + "." + [...e.classList].join("."), x: +b.x.toFixed(1), y: +b.y.toFixed(1), r: +b.right.toFixed(1), b: +b.bottom.toFixed(1), overflow: s.overflowX + "/" + s.overflowY, contain: s.contain, filter: s.filter, bf: s.backdropFilter, clip: s.clipPath, mask: s.maskImage, bg: s.backgroundColor, wc: s.willChange, shadow: s.boxShadow.slice(0, 80) }); } return out; });
    for (const o of r.slice(0, 7)) console.log(JSON.stringify(o));
  }
  const c = await card.boundingBox();
  const x = Math.max(0, c.x - 125), y = Math.max(0, c.y - 85);
  await p.screenshot({ path: join(PASTA, `${rotulo}-${w}.png`), clip: { x, y, width: Math.min(474, w - x), height: Math.min(327, h - y) } });
  await ctx.close();
}
await nav.close();
