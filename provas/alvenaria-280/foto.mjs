// 280: campo Conserto vermelho quando tem texto. Cópia de exemplo própria em 3121/3221.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  const marca = () => p.evaluate(() => { document.getElementById("m")?.remove(); const d = document.createElement("div"); d.id = "m"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;top:8px;z-index:99999;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
  await p.goto("http://127.0.0.1:3221/entrar", { waitUntil: "networkidle" });
  await p.goto("http://127.0.0.1:3121/conteudos", { waitUntil: "networkidle" });
  await p.waitForTimeout(3000);
  await p.getByText("Reels: contabilidade sem mistério").first().click();
  await p.locator("dialog.ficha[open]").waitFor();
  const campo = p.locator("dialog.ficha .ficha-conserto textarea");
  await campo.scrollIntoViewIfNeeded();
  await marca(); await p.screenshot({ path: `${PASTA}1-vazio-${w}.png` });
  console.log(w, "vazio borda:", await campo.evaluate((e) => getComputedStyle(e).borderColor));
  await campo.fill("Cortar a pausa do começo e trocar a música.");
  await p.waitForTimeout(300);
  console.log(w, "com texto borda:", await campo.evaluate((e) => getComputedStyle(e).borderColor), "| largura:", await campo.evaluate((e) => getComputedStyle(e).borderTopWidth), "| raio:", await campo.evaluate((e) => getComputedStyle(e).borderRadius), "| rótulo:", await p.locator("dialog.ficha .ficha-conserto .ficha-legenda").evaluate((e) => getComputedStyle(e).color));
  await marca(); await p.screenshot({ path: `${PASTA}2-com-texto-${w}.png` });
  await p.close();
}
await nav.close();
