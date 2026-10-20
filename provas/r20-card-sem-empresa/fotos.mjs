// Prova do 32eb4d5 (item 181): card de Conteúdos sem empresa não mostra empresa nenhuma (antes: "Empresa removida" duas vezes).
// Banco-falso do r19 em 3299 (3 privadas do Matheus sem empresa) + app em 3199. Uso: node provas/r20-card-sem-empresa/fotos.mjs
// Logado como Matheus. Controle: card com empresa continua com o selo.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000, uid = "u-matheus";
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const SEM_EMPRESA = ["Privada do Matheus: roteiro sem empresa", "Privada do Matheus: postagem sem empresa", "Privada do Matheus: atrasada"];
let falhou = false;
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
  const p = await ctx.newPage();
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message));
  p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  await p.goto("http://127.0.0.1:3199/conteudos", { waitUntil: "networkidle" });
  await p.waitForTimeout(900);
  const cards = await p.locator("article").evaluateAll((els) => els.map((a) => ({
    titulo: a.querySelector(".conteudos-titulo")?.textContent.trim(),
    empresa: !!a.querySelector(".conteudos-empresa"),
    texto: a.textContent,
  })).filter((c) => c.titulo));
  const sem = cards.filter((c) => SEM_EMPRESA.includes(c.titulo));
  const removida = cards.filter((c) => c.texto.includes("Empresa removida")).length;
  const comSelo = cards.filter((c) => c.empresa).length;
  const ok = sem.length === SEM_EMPRESA.length && sem.every((c) => !c.empresa) && removida === 0 && comSelo > 0 && !erros.length;
  if (!ok) falhou = true;
  console.log(ok ? "OK   " : "FALHA", w, "| sem empresa achados:", sem.length, "com selo:", sem.filter((c) => c.empresa).length, "| 'Empresa removida':", removida, "| cards com empresa:", comSelo, "| erros:", erros.length ? erros : "nenhum");
  const alvo = p.locator("article", { hasText: SEM_EMPRESA[0] }).first();
  await alvo.scrollIntoViewIfNeeded();
  await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
  await p.screenshot({ path: join(PASTA, `conteudos-matheus-${w}.png`) });
  const c = await alvo.boundingBox(), mg = 16;
  await p.screenshot({ path: join(PASTA, `card-sem-empresa-${w}.png`), clip: { x: Math.max(0, c.x - mg), y: Math.max(0, c.y - mg), width: c.width + 2 * mg, height: c.height + 2 * mg } });
  await ctx.close();
}
await nav.close();
process.exit(falhou ? 1 : 0);
