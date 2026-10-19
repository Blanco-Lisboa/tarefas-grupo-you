import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/tarefas", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  if (w < 800) { await p.getByRole("button", { name: "Agenda", exact: true }).click(); await p.waitForTimeout(1200); }
  const info = await p.evaluate(() => ({ iw: innerWidth, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, vazio: !!document.querySelector(".ag-vazio"), itens: document.querySelectorAll(".ag-item,.ag-card,.ag-inteiro").length }));
  console.log(w, JSON.stringify(info));
  await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
  await p.screenshot({ path: join(PASTA, `agenda-${w}.png`) });
}
await nav.close();
