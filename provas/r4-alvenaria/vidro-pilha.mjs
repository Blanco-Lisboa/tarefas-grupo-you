// Item 80: vidro, pilha fechada/aberta, dia de 1, toque no celular (1º toque abre o leque, 2º abre a ficha). Servidor em 3100 ligado.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const marca = (p) => p.evaluate(() => { document.getElementById("marca")?.remove(); const d = document.createElement("div"); d.id = "marca"; d.textContent = "innerWidth " + innerWidth + " | scrollY " + Math.round(scrollY); d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
const irPara = async (p, dia) => { const x = await p.evaluate((d) => document.querySelector(`[data-marco][data-dia="${d}"]`).offsetLeft, dia); await p.evaluate((x) => scrollTo(0, x - innerWidth * (innerWidth > 800 ? 0.3 : 0.12) + 56), x); await p.waitForTimeout(1800); };
const escondidos = (p) => p.evaluate(() => [...document.querySelectorAll(".mapa-bloco")].filter((b) => b.scrollHeight > b.clientHeight + 1).length);
for (const [w, h, toque] of [[1440, 760, false], [390, 844, true]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, hasTouch: toque, isMobile: toque });
  const p = await ctx.newPage();
  const erros = [];
  p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  p.on("pageerror", (e) => erros.push(String(e)));
  await p.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" });
  await p.waitForTimeout(2200);
  for (const [dia, nome] of [["2026-11-08", "cima"], ["2026-11-09", "baixo"]]) {
    await irPara(p, dia);
    await marca(p);
    await p.screenshot({ path: join(PASTA, `vidro-pilha-fechada-${nome}-${w}.png`) });
    const card = p.locator(`[data-marco][data-dia="${dia}"] .mapa-card`).first();
    if (!toque) { const b = await card.boundingBox(); await p.mouse.move(b.x + 30, b.y + 8); await p.waitForTimeout(700); }
    else { const b = await card.boundingBox(); await p.touchscreen.tap(b.x + 30, b.y + 8); await p.waitForTimeout(700); console.log(w, dia, "após 1º toque: ficha aberta?", await p.locator("[aria-label^='Tarefa']").count()); }
    console.log(w, dia, "pilha aberta, blocos que precisam rolar:", await escondidos(p));
    await marca(p);
    await p.screenshot({ path: join(PASTA, `vidro-pilha-aberta-${nome}-${w}.png`) });
    if (toque) {
      await p.locator(`[data-marco][data-dia="${dia}"] .mapa-card`).first().tap();
      await p.waitForTimeout(700);
      console.log(w, dia, "após 2º toque: ficha aberta?", await p.locator("[aria-label^='Tarefa']").count());
      await p.getByRole("button", { name: "Fechar" }).click(); await p.waitForTimeout(500);
    } else {
      // teclado: foco no cartão abre a pilha e o Enter abre a ficha
      await p.mouse.move(5, 5); await p.waitForTimeout(500);
      await p.locator(`[data-marco][data-dia="${dia}"] .mapa-card`).first().focus(); await p.waitForTimeout(600);
      console.log(w, dia, "foco abre o leque, blocos que precisam rolar:", await escondidos(p));
      await p.keyboard.press("Enter"); await p.waitForTimeout(600);
      console.log(w, dia, "Enter abriu a ficha?", await p.locator("[aria-label^='Tarefa']").count());
      await p.getByRole("button", { name: "Fechar" }).click(); await p.waitForTimeout(500);
      await p.mouse.move(5, 5);
    }
  }
  // dia de 1 (cartão com folha fantasma)
  await irPara(p, "2026-10-19");
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(1500);
  await marca(p);
  await p.screenshot({ path: join(PASTA, `vidro-dia-de-1-${w}.png`) });
  console.log(w, "scrollWidth==clientWidth:", await p.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth), "| erros de console:", erros.length ? erros : "nenhum");
  await ctx.close();
}
const r = await nav.newContext({ viewport: { width: 1440, height: 760 }, reducedMotion: "reduce" });
const q = await r.newPage();
await q.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" }); await q.waitForTimeout(800);
await q.evaluate(() => document.querySelector('[data-marco][data-dia="2026-11-08"]').scrollIntoView({ inline: "center" })).catch(() => {});
await marca(q);
await q.screenshot({ path: join(PASTA, "vidro-movimento-reduzido-1440.png") });
await nav.close();
