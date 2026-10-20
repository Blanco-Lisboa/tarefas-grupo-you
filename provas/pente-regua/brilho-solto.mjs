// O card solto do Mapa (22/10) tem de ter a animação de brilho do menu (posição do fundo muda); reduced-motion para.
import { createRequire } from "node:module";
import { join } from "node:path";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000, uid = "u-natham";
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("x")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "f@e.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const rm of ["no-preference", "reduce"]) {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 760 }, reducedMotion: rm });
  await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
  const p = await ctx.newPage(); await p.goto("http://127.0.0.1:3199/mapa", { waitUntil: "networkidle" });
  const c = p.locator('[data-marco][data-dia="2026-10-22"] .mapa-card');
  const r = []; for (let i = 0; i < 3; i++) { r.push(await c.evaluate((e) => getComputedStyle(e).backgroundPosition + " | " + getComputedStyle(e).animationName)); await p.waitForTimeout(600); }
  console.log(rm, r); await ctx.close();
}
await nav.close();
