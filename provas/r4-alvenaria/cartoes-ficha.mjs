// Item 75: cartões do Mapa, hover, abrir a ficha com Enter, salvar e ver o Mapa mudar. Servidor em 3100 ligado.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const marca = (p) => p.evaluate(() => { document.getElementById("marca")?.remove(); const d = document.createElement("div"); d.id = "marca"; d.textContent = "innerWidth " + innerWidth + " | scrollY " + Math.round(scrollY); d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  const erros = [];
  p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  p.on("pageerror", (e) => erros.push(String(e)));
  await p.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" });
  await p.waitForTimeout(2200);
  if (w > 800) await p.locator(".mapa-card").first().hover();
  await marca(p);
  await p.screenshot({ path: join(PASTA, `cartoes-${w}.png`) });
  // teclado: foca o primeiro cartão e abre com Enter
  await p.locator(".mapa-card").first().focus();
  await p.screenshot({ path: join(PASTA, `cartoes-${w}-foco.png`) });
  const titulo = (await p.locator(".mapa-card").first().locator(".mapa-objetivo").innerText()).trim();
  await p.keyboard.press("Enter");
  await p.waitForSelector("[aria-label^='Tarefa']");
  await p.waitForTimeout(700);
  const tituloFicha = await p.locator("[aria-label='Título']").inputValue();
  await marca(p);
  await p.screenshot({ path: join(PASTA, `ficha-do-mapa-${w}.png`) });
  console.log(w, "cartão:", titulo, "| ficha abriu com título:", tituloFicha);
  // salvar: muda o objetivo e confere que o cartão do Mapa muda
  await p.locator("input[placeholder='Para que serve este conteúdo?']").fill("Objetivo trocado pela ficha do Mapa");
  await p.getByRole("button", { name: "Salvar" }).click();
  await p.waitForTimeout(800);
  console.log(w, "depois de salvar, 1º cartão:", (await p.locator(".mapa-card").first().locator(".mapa-objetivo").innerText()).trim());
  console.log(w, "scrollWidth==clientWidth:", await p.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth), "| erros de console:", erros.length ? erros : "nenhum");
  // arraste (rolagem) e animação continuam: o palco anda para o lado
  const antes = await p.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector(".mapa-faixa")).transform).m41);
  await p.evaluate(() => scrollTo(0, 800)); await p.waitForTimeout(900);
  const depois = await p.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector(".mapa-faixa")).transform).m41);
  console.log(w, "faixa x antes/depois de rolar 800px:", Math.round(antes), Math.round(depois));
  await p.close();
}
await nav.close();
