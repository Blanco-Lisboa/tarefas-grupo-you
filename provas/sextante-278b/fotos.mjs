// Item 278: Mapa mostra todo card Postado (dias passados e sem data). Precisa de `npm run exemplo` no ar (3101).
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
for (const [w, h] of [[1903, 900], [1440, 760], [390, 800]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
  const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:3101/mapa", { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  await p.evaluate(() => { const e = document.createElement("div"); e.style.cssText = "position:fixed;top:0;right:0;z-index:99999;background:#000;color:#fff;font:14px monospace;padding:4px"; e.textContent = "innerWidth=" + innerWidth; document.body.append(e); });
  const postados = await p.locator("[data-postado='true']").count();
  console.log(w, "marcos postados:", postados, "| sem data:", await p.locator(".mapa-sem-data button").allTextContents());
  await p.screenshot({ path: join(PASTA, `${w}.png`) });
  await ctx.close();
}
await nav.close();
