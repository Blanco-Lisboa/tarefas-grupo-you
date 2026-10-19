// Fotos do Mapa de volta ao desenho de e9577ba, com a pele da ID. Servidor em 3100 ligado.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  await p.evaluate((w) => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#000;color:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); }, w);
  await p.screenshot({ path: join(PASTA, `mapa-pele-${w}.png`), fullPage: true });
  await p.close();
}
await nav.close();
