import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const p = await nav.newPage({ viewport: { width: 1440, height: 760 } });
await p.goto("http://localhost:3100/pastas", { waitUntil: "networkidle" });
await p.waitForTimeout(3500);
const marca = () => p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;top:8px;z-index:99999;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
await marca();
for (const [emp, nome] of [[0, "you"], [1, "beec"]]) {
  const raiz = p.locator(".pastas-empresa").nth(emp);
  const hit = raiz.locator(".gf-hit").first();
  await hit.scrollIntoViewIfNeeded();
  await p.keyboard.press("Escape");
  // foco só por teclado (:focus-visible): vai da pasta até a folha com Tab
  await hit.focus(); await p.keyboard.press("Shift+Tab"); await p.keyboard.press("Tab"); await p.waitForTimeout(800);
  console.log(nome, "pasta focada:", await p.evaluate(() => { const a = document.activeElement; const c = getComputedStyle(a); return a.className + " " + c.outlineStyle + " " + c.outlineWidth + " " + c.outlineColor; }));
  const box = await raiz.locator(".gf-root").first().boundingBox();
  await p.screenshot({ path: join(PASTA, `16-foco-pasta-${nome}-1440.png`), clip: { x: Math.max(0, box.x - 20), y: box.y - 30, width: 300, height: 330 } });
  await p.keyboard.press("Enter"); await p.waitForTimeout(1200);
  await p.keyboard.press("Tab"); await p.keyboard.press("Tab"); await p.waitForTimeout(800);
  console.log(nome, "folha focada:", await p.evaluate(() => document.activeElement.className));
  await p.screenshot({ path: join(PASTA, `16-foco-folha-${nome}-1440.png`), clip: { x: Math.max(0, box.x - 20), y: box.y - 120, width: 300, height: 420 } });
  await p.keyboard.press("Escape");
}
await p.screenshot({ path: join(PASTA, `16-foco-tela-1440.png`) });
await nav.close();
