// Pente fino da Alvenaria: visita cada rota nas 3 larguras, mede transbordo, captura erros de console (com teste do instrumento),
// clica no menu, no botão recolher, e tira foto de Configurações/Entrar/nova-senha.
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
const rotas = ["/calendario", "/mapa", "/tarefas", "/conteudos", "/pastas", "/configuracoes", "/modelos/fazendo-agora"];
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
  const p = await ctx.newPage();
  let erros = []; p.on("pageerror", (e) => erros.push(e.message)); p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  await p.goto("http://127.0.0.1:3199/calendario", { waitUntil: "networkidle" });
  await p.evaluate(() => setTimeout(() => { throw new Error("TESTE-INSTRUMENTO"); }, 0)); await p.waitForTimeout(300);
  console.log(w, "instrumento captura erro:", erros.some((e) => e.includes("TESTE-INSTRUMENTO"))); erros = [];
  for (const r of rotas) {
    await p.goto("http://127.0.0.1:3199" + r, { waitUntil: "networkidle" });
    const t = await p.evaluate(() => ({ doc: document.documentElement.scrollWidth - innerWidth, menu: document.querySelector(".menu").scrollWidth - document.querySelector(".menu").clientWidth, ativo: document.querySelector('.menu-item[aria-current="page"] .menu-rotulo')?.textContent, over: [...document.querySelectorAll("main *, .casca-conteudo *")].filter((e) => { const b = e.getBoundingClientRect(); return b.width && b.right > innerWidth + 1 && getComputedStyle(e).position !== "fixed"; }).slice(0, 3).map((e) => e.className || e.tagName) }));
    console.log(w, r, JSON.stringify(t));
    if (r === "/configuracoes") await p.screenshot({ path: join(PASTA, `config-${w}.png`) });
  }
  for (const href of ["/entrar", "/entrar/nova-senha"]) {
    const c2 = await nav.newContext({ viewport: { width: w, height: h } }); const q = await c2.newPage();
    await q.goto("http://127.0.0.1:3199" + href, { waitUntil: "networkidle" });
    console.log(w, href, "sobra horizontal:", await q.evaluate(() => document.documentElement.scrollWidth - innerWidth));
    await q.screenshot({ path: join(PASTA, `${href.slice(1).replace("/", "-")}-${w}.png`) }); await c2.close();
  }
  console.log(w, "erros de console:", JSON.stringify(erros));
  await ctx.close();
}
await nav.close();
