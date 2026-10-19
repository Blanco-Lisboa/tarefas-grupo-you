import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const marca = (p) => p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:2147483647;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
for (const [w, h] of [[1440, 760], [390, 844]]) for (const [nome, rotulo] of [["fila", "Fila"], ["foco", "Foco"], ["quadro", "Quadro"]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: rotulo, exact: true }).click();
  await p.waitForTimeout(600);
  await marca(p);
  await p.screenshot({ path: join(PASTA, `../../docs/referencias/2026-10-19-rodada-4/69-mapa-${nome}-${w}.png`) });
  await p.close();
}
await nav.close();
