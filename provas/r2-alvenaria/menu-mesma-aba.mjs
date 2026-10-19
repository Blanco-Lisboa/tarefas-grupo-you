// Item 50: clicar no menu troca de página na MESMA aba. node provas/r2-alvenaria/menu-mesma-aba.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const nav = await chromium.launch({ headless: true });
let falhas = 0;
for (const [w, h, recolher] of [[1440, 760, false], [1440, 760, true], [390, 844, false]]) {
  const c = await nav.newContext({ viewport: { width: w, height: h } });
  const p = await c.newPage();
  await p.goto("http://localhost:3100/calendario", { waitUntil: "networkidle" });
  if (recolher) { await p.getByRole("button", { name: "Recolher menu" }).focus(); await p.keyboard.press("Enter"); }
  const itens = await p.locator(".menu a.menu-item").evaluateAll((l) => l.map((a) => [a.getAttribute("href"), a.getAttribute("target")]));
  for (const [href, alvo] of itens) {
    const antes = c.pages().length;
    await p.locator(`.menu a[href="${href}"]`).click();
    await p.waitForURL(`**${href}`);
    await p.waitForTimeout(300);
    const ok = c.pages().length === antes && p.url().endsWith(href) && (!alvo || alvo === "_self");
    if (!ok) falhas++;
    console.log(`${w}${recolher ? " recolhido" : ""} ${href}: abas ${c.pages().length}, url ${p.url()}, target=${alvo} ${ok ? "OK" : "FALHOU"}`);
  }
  await c.close();
}
await nav.close();
process.exit(falhas ? 1 : 0);
