import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch();
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const y = await p.evaluate(() => { const d = document.querySelector('.mapa-dia[data-dia$="-11-01"]'); const f = document.querySelector(".mapa-faixa"); const pal = document.querySelector(".mapa-palco"); return pal.getBoundingClientRect().top + scrollY + d.offsetLeft - innerWidth * 0.4; });
  await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(1500);
  await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;top:8px;z-index:99999;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
  await p.screenshot({ path: join(PASTA, `mapa-${w}-virada-mes.png`) });
  await p.close();
}
await nav.close();
