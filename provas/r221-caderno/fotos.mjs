// Item 221: agenda pessoal do Natham no Caderno. Banco-falso em 3299 + app em 3593. Uso: node provas/r221-caderno/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000;
const cookie = (uid) => {
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  return { name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" };
};
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const erros = [];
const abrir = async (uid, w = 1440, h = 900) => {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  await ctx.addCookies([cookie(uid)]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erros.push(e.message));
  await p.clock.setFixedTime(new Date(2026, 9, 21, 8, 0));
  await p.goto("http://127.0.0.1:3593/tarefas", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  return p;
};
const lista = (p) => p.evaluate(() => [...document.querySelectorAll(".folha .linha")].map((li) => { const t = li.querySelector(".risco"); return t ? `${li.querySelector(".linha-hora-txt")?.textContent}|${t.textContent.trim()}|${li.dataset.faixa ?? "-"}|${li.dataset.feita}|${li.querySelector(".detalhe")?.textContent}` : li.dataset.faixa ? `${li.querySelector(".linha-hora-txt")?.textContent}|(continua)|${li.dataset.faixa}` : null; }).filter(Boolean));
const contador = (p) => p.locator(".tarefas-contador").innerText();

const p = await abrir("u-natham");
console.log((await lista(p)).join("\n"));
console.log("contador:", (await contador(p)).replace(/\n/g, " "));
const nasLinhas = await p.evaluate(() => [...document.querySelectorAll(".folha .risco")].some((e) => e.textContent.includes("contato@")));
console.log("contato@ nas linhas:", nasLinhas, "| 'Reunião de alinhamento' do Google em dobro:", (await lista(p)).filter((x) => /alinhamento/i.test(x)).length);
await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:3px 8px"; document.body.append(d); });
await p.screenshot({ path: join(PASTA, "caderno-1440.png") });
// marcar o café (10:15) como feito e recarregar: o visto fica
await p.getByRole("button", { name: /(Marcar como feita|Desmarcar): Café com fornecedor/ }).click();
await p.waitForTimeout(600);
console.log("depois de marcar:", (await contador(p)).replace(/\n/g, " "));
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(1500);
console.log("depois de recarregar:", (await lista(p)).filter((x) => /Café|Dentista/.test(x)).join(" || "), "|", (await contador(p)).replace(/\n/g, " "));
// Caderno do Matheus visto pelo Natham: sem agenda do Natham
await p.getByRole("button", { name: /Caderno de/ }).click();
await p.locator(".selecao-pop:popover-open .selecao-opcao", { hasText: "Matheus" }).click();
await p.waitForTimeout(800);
console.log("caderno do Matheus, compromissos do Google:", (await lista(p)).filter((x) => /Dentista|Café|Nova Era|podcast/.test(x)).length);
const m = await abrir("u-matheus");
console.log("Matheus logado, compromissos do Natham:", (await lista(m)).filter((x) => /Dentista|Café|Nova Era|podcast/.test(x)).length);
// foto alta: o dia inteiro do caderno de uma vez (07:00 às 22:00)
const alta = await abrir("u-natham", 1440, 1620);
await alta.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:3px 8px"; document.body.append(d); });
await alta.screenshot({ path: join(PASTA, "caderno-1440-dia-todo.png") });
console.log("erros de página:", erros.length, erros.slice(0, 2));
await nav.close();
