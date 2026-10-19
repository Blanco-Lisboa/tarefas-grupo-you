// Prova da Pastas (rodada 2, itens 46, 47, 49). Servidor ligado em 3101: node provas/r2-vitral/capturar.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const erros = [];
const nav = await chromium.launch({ headless: true });
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const p = await (await nav.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on("console", (m) => m.type() === "error" && erros.push(`[${w}] ${m.text()}`));
  p.on("pageerror", (e) => erros.push(`[${w}] ${e.message}`));
  await p.goto("http://localhost:3101/pastas", { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  const rola = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (rola > 0) erros.push(`[${w}] rola na horizontal ${rola}px`);
  const marca = () => p.evaluate(() => { document.querySelector("#m")?.remove(); const s = document.createElement("div"); s.id = "m"; s.textContent = `innerWidth ${innerWidth}`; s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px"; document.body.append(s); });
  await marca();
  await p.screenshot({ path: join(PASTA, `r2-${w}-pastas.png`) });
  await p.locator(".gf-hit").first().click();
  await p.waitForTimeout(1500);
  await marca();
  await p.screenshot({ path: join(PASTA, `r2-${w}-pastas-aberta.png`) });
}
await nav.close();
console.log(erros.length ? erros.join("\n") : "sem erros");
