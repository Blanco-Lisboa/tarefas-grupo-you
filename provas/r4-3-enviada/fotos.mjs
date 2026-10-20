// R4-3: quem enviou a tarefa continua vendo, editando e apagando no próprio caderno. Uso: node provas/r4-3-enviada/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const BASE = "http://127.0.0.1:3199";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const cookie = (uid) => {
  const exp = 1893456000;
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  return { name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" };
};
const estado = async () => (await fetch("http://127.0.0.1:3299/__estado")).json();
const erros = [];
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const foto = async (p, nome) => {
  await p.evaluate(() => { document.getElementById("prova-iw")?.remove(); const d = document.createElement("div"); d.id = "prova-iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:3px 8px;pointer-events:none"; document.body.append(d); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: join(PASTA, `${nome}.png`) });
};
const abrir = async (uid, w, h) => {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  await ctx.addCookies([cookie(uid)]);
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date(2026, 9, 20, 9, 0));
  p.on("pageerror", (e) => erros.push(`[${w}] ${e.message}`));
  p.on("console", (m) => m.type() === "error" && !/403|404/.test(m.text()) && erros.push(`[${w}] console: ${m.text()}`));
  await p.goto(BASE + "/tarefas", { waitUntil: "networkidle" });
  await p.waitForTimeout(700);
  return { ctx, p };
};
const titulos = (p) => p.locator(".folha .linha .risco").allTextContents();
const selos = (p) => p.locator(".folha .linha-selo").allTextContents();

for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  // Matheus: vê o que enviou, com selo "enviada → Natham", e edita/apaga
  let { ctx, p } = await abrir("u-matheus", w, h);
  console.log(w, "Matheus títulos:", JSON.stringify(await titulos(p)), "| selos:", JSON.stringify(await selos(p)));
  await foto(p, `matheus-caderno-${w}`);
  const linha = p.locator(".folha .linha", { hasText: "Matheus manda ao Natham" });
  console.log(w, "Matheus: caixa habilitada:", await linha.locator("button.caixa:not([disabled])").count(), "| menu ⋮:", await linha.locator(".mt-pontos").count());
  await linha.locator("button.caixa").click(); await p.waitForTimeout(500);
  console.log(w, "Matheus marcou a tarefa enviada; no banco concluída =", (await estado()).find((x) => x.id === "t1").concluida);
  await linha.locator("button.caixa").click(); await p.waitForTimeout(500); // desmarca para a prova repetir
  await linha.locator(".abrir").click({ force: true }); await p.waitForTimeout(400);
  console.log(w, "Matheus ficha: Salvar:", await p.locator("dialog[open] button[type=submit]").count(), "| Excluir:", await p.locator("dialog[open] .ficha-lixeira").count());
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  if (w === 1903) {
    await p.getByRole("button", { name: "Sem data" }).click(); await p.waitForTimeout(400);
    console.log(w, "Matheus sem data:", JSON.stringify(await titulos(p)), "| selos:", JSON.stringify(await selos(p)));
    await foto(p, `matheus-sem-data-${w}`);
  }
  await ctx.close();

  // Natham: a recebida só leitura, selo "enviada por Matheus"; vendo o caderno do Matheus a tarefa dele não repete
  ({ ctx, p } = await abrir("u-natham", w, h));
  console.log(w, "Natham títulos:", JSON.stringify(await titulos(p)), "| selos:", JSON.stringify(await selos(p)));
  const rec = p.locator(".folha .linha", { hasText: "Matheus manda ao Natham" });
  console.log(w, "Natham recebida: caixa habilitada:", await rec.locator("button.caixa:not([disabled])").count(), "| menu ⋮:", await rec.locator(".mt-pontos").count());
  await foto(p, `natham-caderno-${w}`);
  await p.getByRole("button", { name: /Caderno de/ }).click();
  await p.locator(".selecao-pop:popover-open .selecao-opcao", { hasText: "Matheus" }).click(); await p.waitForTimeout(500);
  const doMatheus = await titulos(p);
  console.log(w, "Natham vendo Matheus:", JSON.stringify(doMatheus), "| selos:", JSON.stringify(await selos(p)), "| sem repetição:", new Set(doMatheus).size === doMatheus.length);
  await foto(p, `natham-vendo-matheus-${w}`);
  await ctx.close();
}

// Apagar: Matheus apaga a tarefa que enviou (pelo ⋮), no banco ela some; Natham não consegue apagar a recebida
{
  const { ctx, p } = await abrir("u-matheus", 1440, 760);
  const linha = p.locator(".folha .linha", { hasText: "Matheus manda ao Natham" });
  await linha.hover(); await linha.locator(".mt-pontos").click();
  await p.locator(".selecao-pop:popover-open .selecao-opcao", { hasText: "Excluir" }).click(); await p.waitForTimeout(300);
  await p.locator(".mt-perigo:visible").click(); await p.waitForTimeout(600);
  console.log("Matheus apagou a enviada; no banco ainda existe:", (await estado()).some((x) => x.id === "t1"));
  await ctx.close();
}
await nav.close();
console.log(erros.length ? "ERROS:\n" + erros.join("\n") : "sem erros de página");
