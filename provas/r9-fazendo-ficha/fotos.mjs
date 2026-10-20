// Fotos do item 170 etapa 2 (botão Começar/Parar na ficha) com sessão de mentira no banco-falso.mjs (ver r7-caderno-cartao/fotos.mjs).
// Natham abre "Reels: bastidores" (ninguém nela): foto antes, clica Começar, foto depois, clica Parar (volta o banco).
// Antes, foto do quadro com o selo do card (Régua). Depois abre "Post - Reels", em que o Matheus está (banco-falso): mostra o nome dele. Uso: node provas/r9-fazendo-ficha/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const BASE = "http://127.0.0.1:3199";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000;
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: "u-natham", exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: "u-natham", aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const cookie = { name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" };
const erros = [];
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const foto = async (p, nome) => {
  await p.evaluate(() => { document.getElementById("prova-iw")?.remove(); const d = document.createElement("div"); d.id = "prova-iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:3px 8px;pointer-events:none"; document.body.append(d); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: join(PASTA, `${nome}.png`) });
};
const topo = (p) => p.locator(".ficha .ficha-agora").innerText().then((s) => s.replace(/\s+/g, " "));
const abrir = async (p, titulo) => { const alvo = p.locator(".conteudos-cartao .conteudos-titulo", { hasText: titulo }).first(); await alvo.click(); await p.locator("dialog.ficha[open]").waitFor(); await p.waitForTimeout(300); };

for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  await ctx.addCookies([cookie]);
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  p.on("pageerror", (e) => erros.push(`[${w}] ${e.message}`));
  p.on("console", (m) => m.type() === "error" && erros.push(`[${w}] console: ${m.text()}`));
  await p.goto(BASE + "/conteudos", { waitUntil: "networkidle" });
  const cartao = p.locator(".conteudos-cartao", { hasText: "Post - Reels" }).first();
  await cartao.scrollIntoViewIfNeeded();
  await p.waitForTimeout(800);
  await foto(p, `card-selo-regua-${w}`); // selo da Régua (etapa 3) no card em que o Matheus está
  await abrir(p, "Reels: bastidores");
  console.log(w, "antes:", await topo(p));
  await foto(p, `antes-${w}`);
  await p.getByRole("button", { name: "Começar" }).click();
  await p.waitForTimeout(500);
  console.log(w, "depois:", await topo(p));
  await foto(p, `depois-${w}`);
  await p.getByRole("button", { name: "Parar" }).click();
  await p.waitForTimeout(500);
  console.log(w, "parou:", await topo(p));
  await p.keyboard.press("Escape");
  await p.locator("dialog.ficha").waitFor({ state: "detached" });
  await abrir(p, "Post - Reels");
  console.log(w, "outra pessoa:", await topo(p));
  await foto(p, `outra-pessoa-${w}`);
  await ctx.close();
}
await nav.close();
console.log(erros.length ? "ERROS:\n" + erros.join("\n") : "sem erros de página");
