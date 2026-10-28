// Prova: chips do Mês das Postagens não saem da célula (Lince, 390). Cópia de exemplo (3101), mesmo login do datas-importantes/fotos.mjs.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.PW_DIR ?? join(process.env.APPDATA, "npm"), "node_modules", "/"));
const { chromium } = require(process.env.PW_DIR ? "playwright-core" : "playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const marca = () => { const d = document.createElement("div"); d.id = "iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); };
const nav = await chromium.launch({ channel: process.env.PW_DIR ? "chrome" : undefined, args: ["--window-position=-32000,0"] });
const p = await (await nav.newContext({ viewport: { width: 1440, height: 760 } })).newPage();
await p.goto("http://127.0.0.1:3201/entrar", { waitUntil: "load" });
await p.goto("http://127.0.0.1:3101/calendario", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
const postagens = p.locator(".ptroca button", { hasText: "Postagens" });
if (await postagens.getAttribute("aria-pressed") !== "true") await postagens.click();
await p.locator(".cal-acoes .selecao-botao").filter({ has: p.locator(".selecao-rotulo-p", { hasText: "Visão" }) }).click();
await p.locator('.selecao-lista[aria-label="Visão"] .selecao-opcao', { hasText: "Mês" }).first().click();
await p.keyboard.press("Escape");
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(700);
  await p.evaluate(() => document.getElementById("iw")?.remove()); await p.evaluate(marca);
  const vaza = await p.evaluate(() => [...document.querySelectorAll(".pmes .pbloco-chip")].filter((c) => c.getBoundingClientRect().right > c.closest(".mes-celula").getBoundingClientRect().right + 0.5).length);
  console.log(w, "chips que vazam:", vaza);
  await p.screenshot({ path: `${PASTA}postagens-mes-${w}.png` });
}
await nav.close();
