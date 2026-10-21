// Item 213: fotos do Mapa (pastas por empresa) e da tela Pastas, antes (3471, build do commit anterior) e depois (3472).
// Precisa do banco-falso.mjs (3299) e dos dois apps no ar (ver BRIEF-2026-10-20-alvenaria-157-158.md). Uso: node provas/vitral-213/fotos.mjs
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
const marca = (p) => p.evaluate(() => { document.getElementById("marca-iw")?.remove(); const d = document.createElement("div"); d.id = "marca-iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
const abrirPagina = async (porta, rota, w, h) => {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
  const p = await ctx.newPage();
  p.erros = [];
  p.on("pageerror", (e) => p.erros.push(e.message));
  await p.goto(`http://127.0.0.1:${porta}${rota}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  return p;
};
for (const [w, h] of [[1440, 760], [1903, 900]]) {
  // Pastas antes/depois
  for (const [nome, porta] of [["antes", 3471], ["depois", 3472]]) {
    const p = await abrirPagina(porta, "/pastas", w, h);
    await marca(p);
    await p.screenshot({ path: join(PASTA, `pastas-${nome}-${w}.png`) });
    await p.context().close();
  }
  // Mapa antes
  let p = await abrirPagina(3471, "/mapa", w, h);
  await marca(p);
  await p.screenshot({ path: join(PASTA, `mapa-antes-${w}.png`) });
  await p.context().close();
  // Mapa depois
  p = await abrirPagina(3472, "/mapa", w, h);
  await marca(p);
  await p.screenshot({ path: join(PASTA, `mapa-depois-${w}.png`) });
  console.log(w, "pastas no mapa:", await p.locator(".mapa-pasta").count());
  const caixas = await p.locator(".mapa-pasta").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; }));
  console.log("caixas", JSON.stringify(caixas));
  if (w === 1440) {
    // abre a pasta da You do dia 20 e olha as folhas
    await p.locator(".mapa-pasta .gf-hit").first().click();
    await p.waitForTimeout(1500);
    await marca(p);
    await p.screenshot({ path: join(PASTA, `mapa-pasta-aberta-${w}.png`) });
    const folhas = await p.locator(".mapa-pasta-grande .gf-sheet-name").allTextContents();
    console.log("folhas da pasta aberta:", folhas);
    const cor = await p.locator(".mapa-pasta-grande .gf-sheet").last().evaluate((e) => [getComputedStyle(e).backgroundColor, getComputedStyle(e.querySelector(".gf-sheet-name")).color]);
    console.log("folha: fundo, texto", cor);
    // clica na folha da frente e confere a ficha
    await p.locator(".mapa-pasta-grande .gf-sheet").last().click();
    await p.waitForTimeout(1200);
    const ficha = await p.locator("dialog[open]").first().innerText().catch(() => "(sem dialog)");
    console.log("ficha aberta:", ficha.split("\n").slice(0, 6).join(" | "));
    await marca(p);
    await p.screenshot({ path: join(PASTA, `mapa-ficha-${w}.png`) });
    // fecha e abre de novo; clicar na pasta grande fecha
    await p.keyboard.press("Escape");
    await p.waitForTimeout(500);
    await p.locator(".mapa-pasta .gf-hit").nth(1).click();
    await p.waitForTimeout(1200);
    console.log("abriu 2ª pasta:", await p.locator(".mapa-pasta-grande").count());
    await p.locator(".mapa-pasta-grande .gf-hit").click();
    await p.waitForTimeout(600);
    console.log("fechou clicando na pasta:", await p.locator(".mapa-pasta-grande").count() === 0);
    // dia cheio: rola até a faixa chegar no dia 27
    await p.evaluate(() => scrollTo(0, 900));
    await p.waitForTimeout(900);
    await marca(p);
    await p.screenshot({ path: join(PASTA, `mapa-rolado-${w}.png`) });
    // dia cheio (6 folhas): abre e confere "Ver todas"
    const cheia = p.locator(".mapa-pasta", { hasText: "6 conteúdos" }).locator(".gf-hit");
    await cheia.click();
    await p.waitForTimeout(1500);
    await marca(p);
    await p.screenshot({ path: join(PASTA, `mapa-pasta-cheia-${w}.png`) });
    await p.locator(".mapa-pasta-grande .gf-todas").first().click();
    await p.waitForTimeout(500);
    console.log("Ver todas manteve a pasta aberta:", await p.locator(".mapa-pasta-grande").count() === 1, "| itens na lista:", await p.locator(".mapa-pasta-grande .gf-lista li").count());
    await p.screenshot({ path: join(PASTA, `mapa-pasta-cheia-lista-${w}.png`) });
    await p.keyboard.press("Escape");
  }
  console.log(w, "erros:", p.erros.length ? p.erros : "nenhum");
  await p.context().close();
}
await nav.close();
