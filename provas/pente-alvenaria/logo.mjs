// Item 174: fotos do menu (aberto, recolhido, celular) + medida do centro do selo contra o centro do menu.
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
for (const [w, h, rec] of [[1903, 900, false], [1903, 900, true], [1440, 760, false], [390, 844, false]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
  const p = await ctx.newPage();
  const erros = []; p.on("pageerror", (e) => erros.push(e.message)); p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  await p.goto("http://127.0.0.1:3199/conteudos", { waitUntil: "networkidle" });
  if (rec) { await p.locator(".menu-alterna").click(); await p.waitForTimeout(600); }
  await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:200px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
  const m = await p.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(); const menu = r(".menu"), selo = r(".menu-selo"), nome = r(".menu-nome"); const conj = [selo.left, Math.max(selo.right, nome.width > 1 ? nome.right : 0)]; return { menuCentro: menu.left + menu.width / 2, seloCentro: selo.left + selo.width / 2, conjuntoCentro: (conj[0] + conj[1]) / 2, topoSelo: selo.top, topoBarra: document.querySelector(".casca-barra")?.getBoundingClientRect().top }; });
  console.log(w, rec ? "recolhido" : "aberto", JSON.stringify(m), "erros:", erros.length);
  await p.locator(".menu").screenshot({ path: join(PASTA, `logo-${w}${rec ? "-recolhido" : ""}.png`) });
  await ctx.close();
}
await nav.close();
