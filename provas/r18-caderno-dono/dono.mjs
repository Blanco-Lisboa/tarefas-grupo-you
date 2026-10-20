// Item 177 (achado 10): o caderno filtra pelo DONO. Banco-falso em 3299 + app em 3199. Uso: node provas/r18-caderno-dono/dono.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const BASE = "http://127.0.0.1:3199";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const cookie = (uid) => {
  const exp = 1893456000;
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  return { name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" };
};
const titulos = (p) => p.evaluate(() => [...document.querySelectorAll(".folha .risco")].filter((e) => e.offsetHeight).map((e) => e.textContent.trim()).filter(Boolean));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
let falhou = false;
const confere = (nome, lista, tem, nao) => {
  const ok = lista.includes(tem) && !lista.includes(nao);
  if (!ok) falhou = true;
  console.log(ok ? "OK  " : "FALHA", nome, JSON.stringify(lista));
};
for (const [quem, uid] of [["natham", "u-natham"], ["matheus", "u-matheus"]]) {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([cookie(uid)]);
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  await p.goto(BASE + "/tarefas", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  const A = "Privada do Natham, passada ao Matheus", B = "Privada do Matheus, passada ao Natham";
  if (quem === "natham") {
    confere("natham no próprio caderno (tem A, não tem B)", await titulos(p), A, B);
    await p.getByRole("button", { name: /Caderno de/ }).click();
    await p.locator(".selecao-pop:popover-open .selecao-opcao", { hasText: "Matheus" }).click();
    await p.waitForTimeout(500);
    confere("natham vendo o caderno do Matheus (tem B, não tem A)", await titulos(p), B, A);
  } else {
    confere("matheus no próprio caderno (tem B, não tem A)", await titulos(p), B, A);
  }
  await ctx.close();
}
await nav.close();
process.exit(falhou ? 1 : 0);
