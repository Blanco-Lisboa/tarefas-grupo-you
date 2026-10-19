import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/pastas", { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  const marca = () => p.evaluate(() => { document.getElementById("marca")?.remove(); const d = document.createElement("div"); d.id = "marca"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
  const btn = p.getByRole("button", { name: /Abrir Adrian - Aprovar/ }).first();
  await btn.scrollIntoViewIfNeeded(); await p.waitForTimeout(1200);
  await marca(); await p.screenshot({ path: join(PASTA, `62-fechada-${w}.png`) });
  await btn.click(); await p.waitForTimeout(1800); console.log(w, "aberta:", await p.getByRole("button", { name: /Fechar Adrian/ }).count());
  await marca(); await p.screenshot({ path: join(PASTA, `62-aberta-${w}.png`) });
  console.log(w, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
}
await nav.close();
