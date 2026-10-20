// Clica cada item do menu, o botão Recolher/Expandir (e confere que lembra após recarregar), Sair não (encerraria a sessão), entra em Configurações e inclui empresa vazia/duplicada.
import { createRequire } from "node:module";
import { join } from "node:path";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000, uid = "u-natham";
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const ctx = await nav.newContext({ viewport: { width: 1440, height: 760 } });
await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
const p = await ctx.newPage(); const erros = []; p.on("pageerror", (e) => erros.push(e.message)); p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
await p.goto("http://127.0.0.1:3199/calendario", { waitUntil: "networkidle" });
for (const nome of ["Mapa", "Caderno", "Conteúdos", "Pastas", "Configurações", "Calendário"]) {
  await p.locator(".menu-item", { hasText: nome }).first().click(); await p.waitForLoadState("networkidle");
  console.log("clicou", nome, "→", new URL(p.url()).pathname, "| ativo:", await p.locator('.menu-item[aria-current="page"]').first().innerText());
}
await p.locator(".menu-alterna").click(); await p.waitForTimeout(400);
console.log("recolhido:", await p.evaluate(() => document.documentElement.dataset.menu), "largura", await p.locator(".menu").evaluate((e) => e.getBoundingClientRect().width));
await p.reload({ waitUntil: "networkidle" });
console.log("após recarregar:", await p.evaluate(() => document.documentElement.dataset.menu));
await p.locator(".menu-alterna").click(); await p.waitForTimeout(400);
await p.goto("http://127.0.0.1:3199/configuracoes", { waitUntil: "networkidle" });
await p.fill("#config-nova-empresa", "beec"); await p.click(".config-botao"); await p.waitForTimeout(300);
console.log("duplicada →", await p.locator(".config-erro").innerText());
console.log("erros de console:", JSON.stringify(erros));
await nav.close();
