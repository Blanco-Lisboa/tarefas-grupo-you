// 307/309: coluna Postado ordenada + rodape com data de postagem + ficha de card Postado com Publicacao. Precisa de `npm run exemplo` no ar (3101). Uso: node fotos.mjs
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
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
const erros = [];
const p = await ctx.newPage();
p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
await p.goto("http://127.0.0.1:3101/conteudos", { waitUntil: "networkidle" });
await p.waitForTimeout(2500);
const titulos = (etapa) => p.evaluate((e) => [...document.querySelectorAll(`[data-etapa="${e}"] .conteudos-titulo`)].map((x) => x.textContent), etapa);
const original = (await titulos("edicao"))[0];
console.log("original:", original, "| innerWidth", await p.evaluate(() => innerWidth));
const abrir = (t) => p.locator('[data-etapa="edicao"] .conteudos-titulo', { hasText: t }).first().click();
await abrir(original);
await p.waitForTimeout(800);
await p.screenshot({ path: PASTA + "ficha-com-duplicar.png" });
for (let i = 0; i < 2; i++) {
  if (i) { await abrir(original); await p.waitForTimeout(800); }
  await p.getByRole("button", { name: "Duplicar", exact: true }).click();
  await p.waitForTimeout(1500);
}
console.log("edicao:", JSON.stringify(await titulos("edicao")));
await p.evaluate(() => document.querySelector('[data-etapa="edicao"]')?.scrollIntoView({ inline: "center" }));
await p.evaluate(() => { document.title = "innerWidth=" + innerWidth; });
await p.screenshot({ path: PASTA + "esteira-copias.png" });
// Postado -> a cópia entra em Roteiro
const antes = (await titulos("roteiro")).length;
await p.locator('[data-etapa="postado"] .conteudos-titulo').first().click();
await p.waitForTimeout(800);
await p.getByRole("button", { name: "Duplicar", exact: true }).click();
await p.waitForTimeout(1500);
console.log("roteiro antes/depois:", antes, (await titulos("roteiro")).length, JSON.stringify((await titulos("roteiro")).filter((x) => x.includes("Cópia"))));
console.log("erros console:", erros.length, erros.slice(0, 3));
await nav.close();
