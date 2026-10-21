// 263: caderno do Natham antes/depois e "Caderno de Matheus" editando tarefa enviada. App de exemplo em 3101.
// Uso: node provas/r263/fotos.mjs antes | depois
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const fase = process.argv[2] ?? "depois";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000, uid = "u-natham";
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const marca = (p) => p.evaluate(() => { document.getElementById("iw")?.remove(); const d = document.createElement("div"); d.id = "iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
const titulos = (p) => p.evaluate(() => [...document.querySelectorAll(".folha .risco")].filter((e) => e.offsetHeight).map((e) => e.textContent.trim()).filter(Boolean));
for (const [w, h] of [[1903, 900], [1440, 760], [390, 800]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
  const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:3101/tarefas", { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  await marca(p);
  console.log(fase, w, "natham:", JSON.stringify(await titulos(p)));
  await p.screenshot({ path: join(PASTA, `caderno-natham-${fase}-${w}.png`) });
  if (fase === "depois" && w === 1440) {
    await p.getByRole("button", { name: /Caderno de/ }).click();
    await p.locator(".selecao-pop:popover-open .selecao-opcao", { hasText: "Matheus" }).click();
    await p.waitForTimeout(800);
    await marca(p);
    console.log("matheus visto:", JSON.stringify(await titulos(p)));
    await p.screenshot({ path: join(PASTA, "caderno-matheus-visto-1440.png") });
    await p.locator(".folha .risco", { hasText: "Mandar a logo da Beec" }).first().click();
    await p.waitForTimeout(800);
    const campo = p.locator("dialog[open] textarea, dialog[open] input[type=text]").first();
    await campo.fill("Mandar a logo da Beec ao contador (editado pelo Natham)");
    await marca(p);
    await p.screenshot({ path: join(PASTA, "caderno-matheus-editando-1440.png") });
    await p.getByRole("button", { name: "Salvar" }).click();
    await p.waitForTimeout(1500);
    console.log("depois de salvar:", JSON.stringify(await titulos(p)));
    await marca(p);
    await p.screenshot({ path: join(PASTA, "caderno-matheus-salvo-1440.png") });
  }
  await ctx.close();
}
await nav.close();
