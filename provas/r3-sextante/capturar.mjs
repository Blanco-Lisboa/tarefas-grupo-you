// Prova do item 57 (Sextante): /modelos em 1903, 1440 e 390, tela e página inteira, mais os estados dos botões.
// Servidor em 3100 ligado. Chrome headless (fora da tela), nunca usa o mouse/teclado de verdade.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

const PASTA = fileURLToPath(new URL("./", import.meta.url));
const erros = [];
const b = await chromium.launch();
const marcar = (p) => p.evaluate(() => {
  const s = document.createElement("div");
  s.textContent = `innerWidth ${innerWidth}`;
  s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#000;color:#fff;font:700 13px monospace;padding:3px 8px;pointer-events:none";
  document.body.append(s);
});

for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  p.on("console", (m) => m.type() === "error" && !m.text().includes("WebSocket") && erros.push(`[${w}] console: ${m.text()}`));
  p.on("pageerror", (e) => erros.push(`[${w}] pageerror: ${e.message}`));
  await p.goto("http://127.0.0.1:3100/modelos", { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  const larg = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (larg > 0) erros.push(`[${w}] página rola na horizontal (${larg}px)`);
  await marcar(p);
  await p.screenshot({ path: join(PASTA, `${w}-tela.png`) });
  await p.locator(".modelos-grade").scrollIntoViewIfNeeded();
  await p.evaluate(() => document.querySelector(".modelos-grade").scrollIntoView());
  await p.screenshot({ path: join(PASTA, `${w}-modelos.png`) });
  await p.screenshot({ path: join(PASTA, `${w}-inteira.png`), fullPage: true });
  if (w === 1440) {
    // Estados: mouse no primário do 1, foco no secundário do 2, seletor fechado do 3 aberto pelo clique.
    await p.locator("#modelo-1 .b-pri").hover();
    await p.locator("#modelo-2 .b-sec").focus();
    await p.locator("#modelo-3 .sel-botao").first().click();
    await p.waitForTimeout(400);
    const n = await p.locator(".sel-lista").count();
    if (n !== 1) erros.push(`[1440] listas abertas: ${n} (clicar num seletor fecha os outros; esperado 1)`);
    await p.locator(".modelos-grade").screenshot({ path: join(PASTA, "1440-estados.png") });
  }
  await ctx.close();
}
// Movimento reduzido: tudo montado, sem animação.
const ctx = await b.newContext({ viewport: { width: 1440, height: 760 }, reducedMotion: "reduce" });
const p = await ctx.newPage();
await p.goto("http://127.0.0.1:3100/modelos", { waitUntil: "networkidle" });
const dur = await p.evaluate(() => getComputedStyle(document.querySelector(".mod .b-pri")).transitionDuration);
if (!/^0s(, 0s)*$/.test(dur)) erros.push(`reduced-motion: transição ${dur}`);
await b.close();
console.log(erros.length ? erros.join("\n") : "sem erros");
