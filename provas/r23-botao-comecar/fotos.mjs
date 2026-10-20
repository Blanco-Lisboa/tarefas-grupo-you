// Fotos do item 184 (botão Começar/Parar da ficha com a receita do item ativo do menu, em verde) com sessão de mentira no banco-falso.mjs (ver r7-caderno-cartao/fotos.mjs).
// Natham abre "Reels: bastidores" na Esteira: foto com Começar, clica, foto com Parar, clica Parar (volta o banco). Mede a animação e as cores.
// Em 1440 (escala 2) recorta o item ativo do menu e os dois botões e monta lado-a-lado.png. Uso: node provas/r23-botao-comecar/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const BASE = "http://127.0.0.1:3198"; // 3199 ocupado por um servidor esquecido de outro terminal
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
const estilo = (p) => p.locator(".ficha-agora-botao").evaluate((b) => { const s = getComputedStyle(b); return `${b.textContent} | animação ${s.animationName} | cor ${s.color} | raio ${s.borderRadius} | fundo ${s.backgroundColor} | posição ${s.backgroundPosition}`; });
const recortes = {};

for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w === 1440 ? 2 : 1 });
  await ctx.addCookies([cookie]);
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  p.on("pageerror", (e) => erros.push(`[${w}] ${e.message}`));
  p.on("console", (m) => m.type() === "error" && erros.push(`[${w}] console: ${m.text()}`));
  await p.goto(BASE + "/conteudos", { waitUntil: "networkidle" });
  if (w === 1440) recortes.menu = await p.locator('.menu-item[aria-current="page"]').screenshot();
  await p.locator(".conteudos-cartao .conteudos-titulo", { hasText: "Reels: bastidores" }).first().click();
  await p.locator("dialog.ficha[open]").waitFor();
  await p.waitForTimeout(300);
  console.log(w, "começar:", await estilo(p));
  await p.waitForTimeout(600);
  console.log(w, "600ms depois:", await estilo(p));
  await foto(p, `comecar-${w}`);
  if (w === 1440) {
    recortes.comecar = await p.locator(".ficha-agora").screenshot();
    await p.locator(".ficha-agora-botao").hover();
    console.log(w, "hover:", await estilo(p));
    await foto(p, `comecar-hover-${w}`);
    await p.mouse.move(0, 0);
    await p.locator(".ficha-agora-botao").evaluate((b) => b.focus({ focusVisible: true })); // foco de teclado
    await foto(p, `comecar-foco-${w}`);
  }
  await p.getByRole("button", { name: "Começar" }).click();
  await p.mouse.move(0, 0);
  await p.waitForTimeout(500);
  console.log(w, "parar:", await estilo(p));
  await p.locator(".ficha-agora-botao").evaluate((b) => b.blur());
  await foto(p, `parar-${w}`);
  if (w === 1440) recortes.parar = await p.locator(".ficha-agora").screenshot();
  await p.getByRole("button", { name: "Parar" }).click();
  await p.waitForTimeout(500);
  console.log(w, "voltou:", await p.locator(".ficha-agora-botao").innerText());
  await ctx.close();
}

const u = (b) => "data:image/png;base64," + b.toString("base64");
const pg = await nav.newPage({ viewport: { width: 1100, height: 300 } });
const fig = (t, b) => `<figure style="margin:0"><figcaption style="margin-bottom:8px">${t}</figcaption><div style="padding:16px;background:#F7F7F9;border:1px solid #ddd"><img src="${u(b)}" style="height:88px;display:block"></div></figure>`;
await pg.setContent(`<body style="margin:0;padding:16px;font:600 14px sans-serif;background:#fff"><div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">${fig("Menu: item selecionado (Esteira)", recortes.menu)}${fig("Ficha: Começar (novo, verde)", recortes.comecar)}${fig("Ficha: Parar (sou eu fazendo)", recortes.parar)}</div></body>`);
await pg.screenshot({ path: join(PASTA, "lado-a-lado.png"), fullPage: true });
await nav.close();
console.log(erros.length ? "ERROS:\n" + erros.join("\n") : "sem erros de página");
