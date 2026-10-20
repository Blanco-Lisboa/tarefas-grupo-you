// Item 177 (4): força a corrida do erro #418. Atrasa 2s só os pedaços de código próprios da tela (os que as outras telas não usam):
// o menu (casca) hidrata, pede os dados ao banco, e eles chegam antes de a tela hidratar (montar no navegador o HTML do servidor).
// Conta quantas aberturas dão #418. Uso: node provas/r14-calendario-dono/corrida.mjs
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
const TELAS = ["/conteudos", "/calendario", "/tarefas", "/mapa"];
const scripts = async (tela) => [...(await (await fetch(BASE + tela, { headers: { cookie: `${cookie.name}=${cookie.value}` } })).text()).matchAll(/\/_next\/static\/chunks\/[^"']+\.js/g)].map((m) => m[0]);
const todos = Object.fromEntries(await Promise.all(TELAS.map(async (t) => [t, new Set(await scripts(t))])));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const tela of TELAS) {
  const proprios = [...todos[tela]].filter((s) => TELAS.some((o) => o !== tela && !todos[o].has(s)));
  let com418 = 0;
  for (let i = 0; i < 3; i++) {
    const ctx = await nav.newContext({ viewport: { width: 1903, height: 900 } });
    await ctx.addCookies([cookie]);
    const p = await ctx.newPage();
    await p.route((u) => proprios.some((s) => u.pathname === s), async (r) => { await new Promise((ok) => setTimeout(ok, 2000)); await r.continue(); });
    let erro = false;
    p.on("pageerror", (e) => { if (e.message.includes("#418")) erro = true; });
    await p.goto(BASE + tela, { waitUntil: "networkidle" });
    await p.waitForTimeout(800);
    if (erro) com418++;
    await ctx.close();
  }
  console.log(`${tela}: ${proprios.length} pedaços próprios atrasados; #418 em ${com418} de 3 aberturas`);
}
await nav.close();
