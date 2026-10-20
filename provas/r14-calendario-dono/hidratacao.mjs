// Item 177 (4): de onde vem o erro React #418 (hidratação) visto no Calendário em 1903 na prova da lixeira (r13)?
// Abre /calendario com e sem o relógio fixo do teste, direto e depois de /conteudos, e anota os erros de cada caso.
// Uso: node provas/r14-calendario-dono/hidratacao.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const BASE = "http://127.0.0.1:3199";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000;
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: "u-natham", exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: "u-natham", aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const cookie = { name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" };
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });

for (const relogio of ["fixo", "real"]) for (const caminho of ["direto", "depois de /conteudos"]) for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  await ctx.addCookies([cookie]);
  const p = await ctx.newPage();
  if (relogio === "fixo") await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message.slice(0, 60)));
  p.on("console", (m) => m.type() === "error" && erros.push("console: " + m.text().slice(0, 60)));
  if (caminho !== "direto") await p.goto(BASE + "/conteudos", { waitUntil: "networkidle" });
  await p.goto(BASE + "/calendario", { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  console.log(`relógio ${relogio} | ${caminho} | ${w}: ${erros.length ? erros.join(" ; ") : "sem erro"}`);
  await ctx.close();
}
await nav.close();
