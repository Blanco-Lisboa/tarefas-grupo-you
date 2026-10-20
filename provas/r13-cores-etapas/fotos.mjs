// Item 158: fotos da página /PAGINA (3 opções de contorno + Hoje). Uso: node provas/r8-contorno/fotos.mjs
// Precisa do banco-falso.mjs e do app em 3199 (ver BRIEF).
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
  for (const [rota, nome] of [["conteudos", "conteudos"], ["calendario", "calendario"], ["conteudos", "c-cheia"]]) {
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message));
  await p.goto(`http://127.0.0.1:3199/${rota}${nome === "c-cheia" ? "?cheia" : ""}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await p.evaluate(() => { if (location.search === "?cheia") { const e = document.createElement("style"); e.textContent = ".conteudos-coluna-topo{background:var(--etapa)!important;border-bottom-width:1px!important}.conteudos-numero,.conteudos-coluna h2,.conteudos-novo{color:#fff!important}"; document.head.append(e); } const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
  await p.screenshot({ path: join(PASTA, `${nome === "c-cheia" ? "c-cheia" : "meio-termo-" + nome}-${w}.png`), fullPage: w < 600 });
  console.log(nome, w, "erros:", erros.length ? erros : "nenhum");
  }
  await ctx.close();
}
await nav.close();
