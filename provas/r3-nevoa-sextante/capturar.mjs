// Prova da Fase 2 da Névoa (Sextante, calendário): semana em 1903, 1440 e 390; mês, ano e Sem data aberta em 1440.
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
  await p.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.locator(".cal-painel").waitFor();
  const larg = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (larg > 0) erros.push(`[${w}] página rola na horizontal (${larg}px)`);
  const cor = await p.evaluate(() => getComputedStyle(document.querySelector(".cal-titulo h1")).color);
  if (cor !== "rgb(29, 29, 31)") erros.push(`[${w}] título com cor ${cor} (esperado o texto #1D1D1F)`);
  await marcar(p);
  await p.screenshot({ path: join(PASTA, `${w}-semana.png`) });
  if (w !== 390) {
    for (const [tecla, nome] of [["m", "mes"], ["a", "ano"]]) {
      await p.keyboard.press(tecla);
      await p.waitForTimeout(300);
      await p.screenshot({ path: join(PASTA, `${w}-${nome}.png`) });
    }
    await p.keyboard.press("s");
  } else {
    await p.screenshot({ path: join(PASTA, "390-inteira.png"), fullPage: true });
  }
  if (w === 1440) {
    await p.locator(".cal-semdata-botao").click();
    await p.waitForTimeout(400);
    await p.screenshot({ path: join(PASTA, "1440-sem-data.png") });
  }
  await ctx.close();
}
await b.close();
console.log(erros.length ? erros.join("\n") : "sem erros");
