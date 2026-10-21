// Item 213: fotos do Mapa (pastas por empresa) e da tela Pastas, antes (3471, build do commit anterior) e depois (3472).
// Precisa do banco-falso.mjs (3299) e dos dois apps no ar (ver BRIEF-2026-10-20-alvenaria-157-158.md). Uso: node provas/vitral-213/fotos.mjs
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
const abrirPagina = async (porta, rota, w, h) => {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
  const p = await ctx.newPage();
  p.erros = [];
  p.on("pageerror", (e) => p.erros.push(e.message));
  await p.goto(`http://127.0.0.1:${porta}${rota}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(3500);
  return p;
};
for (const [w, h] of [[1440, 760]]) for (const [nome, porta] of [["antes", 3471], ["depois", 3472]]) {
  const p = await abrirPagina(porta, "/pastas", w, h);
  await marca(p);
  await p.screenshot({ path: join(PASTA, `pastas-${nome}-${w}.png`) });
  console.log(nome, "ocasioes:", await p.locator(".pastas-cel").count());
  await p.context().close();
}
await nav.close();
