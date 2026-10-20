// Fotos do item 179 (lixeira no pé da ficha) com sessão de mentira no banco-falso.mjs (ver r7-caderno-cartao/fotos.mjs).
// Natham abre "Reels: bastidores" (dele): foto do ícone, clica a lixeira (foto Apagar/Cancelar), Esc volta ao ícone sem fechar a ficha,
// clica de novo e Cancelar volta ao ícone. Não aperta Apagar. No Calendário, "Mandar a logo" (enviada por ele ao Matheus): sem lixeira.
// Uso: node provas/r13-lixeira-ficha/fotos.mjs
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
const pe = (p) => p.locator(".ficha .ficha-pe").innerText().then((s) => s.replace(/\s+/g, " ").trim() || "(vazio)");
const lixeiras = (p) => p.getByRole("button", { name: "Apagar tarefa" }).count();
const aberta = (p) => p.locator("dialog.ficha[open]").count();

for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  await ctx.addCookies([cookie]);
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  p.on("pageerror", (e) => erros.push(`[${w}] ${e.message}`));
  p.on("console", (m) => m.type() === "error" && erros.push(`[${w}] console: ${m.text()}`));
  await p.goto(BASE + "/conteudos", { waitUntil: "networkidle" });
  await p.locator(".conteudos-cartao .conteudos-titulo", { hasText: "Reels: bastidores" }).first().click();
  await p.locator("dialog.ficha[open]").waitFor();
  await p.locator(".ficha-pe").scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  console.log(w, "ícone:", await lixeiras(p), "lixeira | pé:", await pe(p));
  await foto(p, `icone-${w}`);
  await p.getByRole("button", { name: "Apagar tarefa" }).hover();
  await foto(p, `icone-hover-${w}`);
  await p.getByRole("button", { name: "Apagar tarefa" }).click();
  console.log(w, "clicou:", await pe(p), "| foco:", await p.evaluate(() => document.activeElement?.textContent));
  await foto(p, `apagar-cancelar-${w}`);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(200);
  console.log(w, "Esc:", await pe(p), "| ficha aberta:", await aberta(p));
  await p.getByRole("button", { name: "Apagar tarefa" }).click();
  await p.locator(".ficha-apagando").getByRole("button", { name: "Cancelar" }).click();
  console.log(w, "Cancelar:", await pe(p), "| ficha aberta:", await aberta(p));
  await p.keyboard.press("Escape");
  await p.locator("dialog.ficha").waitFor({ state: "detached" });
  console.log(w, "Esc de novo fecha a ficha:", (await aberta(p)) === 0);
  if (w === 1903) {
    await p.goto(BASE + "/calendario", { waitUntil: "networkidle" });
    const alvo = p.getByText("Mandar a logo", { exact: false }).first();
    if (await alvo.count()) {
      await alvo.click();
      await p.locator("dialog.ficha[open]").waitFor();
      console.log(w, "sem permissão (Mandar a logo):", await lixeiras(p), "lixeira | pé:", await pe(p));
      await foto(p, `sem-permissao-${w}`);
    } else console.log(w, "Mandar a logo não aparece no calendário");
  }
  await ctx.close();
}
await nav.close();
console.log(erros.length ? "ERROS:\n" + erros.join("\n") : "sem erros de página");
