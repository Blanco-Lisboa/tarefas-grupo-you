// Pente fino da Pena (20/10): itens 163 (Excluir dentro do ⋮), 164 (ordem da linha) e achados 1 e 9 da Lupa (caderno alheio só leitura).
// Banco de mentira próprio (banco-falso.mjs desta pasta, porta 3299) + app em 3199. Uso: node provas/pena-pente-fino/fotos.mjs
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
const erros = [];
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const foto = async (p, nome) => {
  await p.evaluate(() => { document.getElementById("prova-iw")?.remove(); const d = document.createElement("div"); d.id = "prova-iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:3px 8px;pointer-events:none"; document.body.append(d); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: join(PASTA, `${nome}.png`) });
};
const linhas = (p) => p.evaluate(() => [...document.querySelectorAll(".folha .linha")].filter((li) => li.querySelector(".linha-texto") && li.offsetHeight).map((li) => {
  const x = (s) => li.querySelector(s)?.getBoundingClientRect();
  const texto = x(".linha-texto"), titulo = x(".abrir"), emp = x(".linha-empresa"), det = x(".detalhe"), etq = x(".linha-etq"), pontos = x(".mt-pontos");
  const risco = li.querySelector(".abrir .risco");
  return {
    t: li.querySelector(".risco").textContent.slice(0, 28),
    ordem: [emp.left, titulo.left, det.left, etq?.left ?? Infinity].every((v, i, a) => i === 0 || v >= a[i - 1] - 0.5) || (innerWidth < 768),
    tituloX: Math.round(titulo.left), cortado: li.querySelector(".abrir").scrollWidth > li.querySelector(".abrir").clientWidth + 1 || risco.getBoundingClientRect().width > li.querySelector(".abrir").clientWidth + 1,
    etqNoFim: etq ? (innerWidth < 768 ? Math.round(texto.right - etq.right) <= 1 : Math.round(texto.right - etq.right) <= 1 && (!pontos || etq.right <= pontos.left + 1)) : null,
    transborda: li.scrollWidth > li.clientWidth + 1 || texto.right > li.getBoundingClientRect().right + 1,
  };
}));

// prova do instrumento: um erro provocado TEM que aparecer na lista
{
  const ctx = await nav.newContext(); const p = await ctx.newPage(); const tmp = [];
  p.on("pageerror", (e) => tmp.push(e.message));
  await p.goto("about:blank"); await p.evaluate(() => setTimeout(() => { throw new Error("erro provocado"); })); await p.waitForTimeout(200);
  console.log("instrumento captura erro:", tmp.length === 1 && tmp[0] === "erro provocado"); await ctx.close();
}

for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  await ctx.addCookies([cookie("u-natham")]);
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  p.on("pageerror", (e) => erros.push(`[${w}] ${e.message}`));
  p.on("console", (m) => m.type() === "error" && erros.push(`[${w}] console: ${m.text()}`));
  await p.goto(BASE + "/tarefas", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  const ls = await linhas(p);
  const xs = [...new Set(ls.map((l) => l.tituloX))];
  console.log(w, "linhas:", ls.length, "| ordem certa:", ls.every((l) => l.ordem), "| prioridade no fim:", JSON.stringify(ls.map((l) => l.etqNoFim)), "| títulos cortados:", ls.filter((l) => l.cortado).map((l) => l.t), "| transbordo de linha:", ls.filter((l) => l.transborda).map((l) => l.t), "| colunas de título:", xs.length === 1 ? "alinhadas" : xs, "| página inteira transborda:", await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  await foto(p, `164-caderno-${w}`);

  // 163: Excluir dentro do ⋮
  const linha = p.locator(".folha .linha", { hasText: "Ligar para o contador" });
  await linha.hover();
  await linha.locator(".mt-pontos").click();
  await p.locator(".selecao-pop:popover-open .selecao-opcao", { hasText: "Excluir" }).click();
  await p.waitForTimeout(300);
  console.log(w, "163 pergunta no menu:", await p.locator(".mt-pergunta:visible").count(), "| foco em Manter:", await p.evaluate(() => document.activeElement?.textContent), "| pergunta na linha:", await p.locator(".linha .confirmar").count());
  await foto(p, `163-excluir-no-menu-${w}`);
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  console.log(w, "163 Esc fecha o menu:", (await p.locator(".selecao-pop:popover-open").count()) === 0);

  // achados 1 e 9: caderno do Matheus é só leitura
  await p.getByRole("button", { name: /Caderno de/ }).click();
  await p.locator(".selecao-pop:popover-open .selecao-opcao", { hasText: "Matheus" }).click();
  await p.waitForTimeout(500);
  await p.locator(".folha .abrir", { hasText: "Post - Reels" }).first().click({ force: true }).catch(() => {});
  await p.waitForTimeout(300);
  console.log(w, "alheio: ficha abriu:", await p.locator("dialog[open]").count(), "| campos de escrever:", await p.locator(".folha input.campo").count(), "| caixas habilitadas:", await p.locator(".folha button.caixa:not([disabled])").count(), "| menus ⋮:", await p.locator(".mt-pontos").count());
  await foto(p, `alheio-caderno-${w}`);
  if (w < 768) await p.getByRole("button", { name: "Agenda", exact: true }).click();
  await p.waitForTimeout(300);
  console.log(w, "alheio: textareas na Agenda:", await p.locator(".agenda textarea").count(), "| 'Para amanhã' visível:", await p.locator(".ag-bloco-amanha:visible").count());
  await foto(p, `alheio-agenda-${w}`);
  await ctx.close();
}
await nav.close();
console.log(erros.length ? "ERROS:\n" + erros.join("\n") : "sem erros de página");
