import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/pastas", { waitUntil: "networkidle" });
  await p.waitForTimeout(3500);
  const hit = p.locator(".pastas-empresa").first().locator(".gf-hit").first();
  await hit.scrollIntoViewIfNeeded();
  await hit.click(); await p.waitForTimeout(1200);
  await p.keyboard.press("Tab"); await p.keyboard.press("Tab"); await p.waitForTimeout(900);
  const ok = await p.evaluate(() => { const a = document.activeElement; return a?.className + " " + getComputedStyle(a).outlineColor + " " + getComputedStyle(a).outlineWidth; });
  console.log(w, ok);
  await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;top:8px;z-index:99999;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
  await p.screenshot({ path: join(PASTA, `11-foco-folha-${w}.png`) });
  await p.screenshot({ path: join(PASTA, `11b-foco-zoom-${w}.png`), clip: { x: 0, y: w > 500 ? 180 : 200, width: Math.min(w, 520), height: 300 } });
  await p.close();
}
await nav.close();
