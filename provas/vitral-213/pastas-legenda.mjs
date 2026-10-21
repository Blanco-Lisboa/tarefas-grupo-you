// 215 Régua 6: tamanho visível do nome e da contagem nas pastas fechadas (Pastas e Mapa) em 1440. App em 3472, banco-falso em 3299.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000, uid = "u-natham";
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "f@e.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1440, 760], [1903, 900]]) for (const rota of ["pastas", "mapa"]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:3472/${rota}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(3000);
  const m = await p.evaluate(() => [...document.querySelectorAll(".gf-root")].slice(0, 3).map((r) => { const k = parseFloat(r.style.getPropertyValue("--gf-k")); const f = (s) => +(parseFloat(getComputedStyle(r.querySelector(s)).fontSize) * k).toFixed(1); const t = r.querySelector(".gf-title"); return { largura: Math.round(r.getBoundingClientRect().width), nome: f(".gf-title"), contagem: f(".gf-meta"), cortado: t.scrollWidth > t.clientWidth }; }));
  console.log(w, rota, JSON.stringify(m));
  await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
  await p.screenshot({ path: join(PASTA, `legenda-${rota}-${w}.png`) });
  await ctx.close();
}
await nav.close();
