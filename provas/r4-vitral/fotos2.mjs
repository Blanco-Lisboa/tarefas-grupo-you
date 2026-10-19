import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1440, 760], [1903, 900], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/pastas", { waitUntil: "networkidle" });
  await p.waitForTimeout(3500);
  const marca = () => p.evaluate(() => { document.getElementById("iw")?.remove(); const d = document.createElement("div"); d.id = "iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;top:8px;z-index:2147483647;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
  await marca();
  await p.screenshot({ path: join(PASTA, `9-cinco-numa-linha-${w}.png`) });
  const tops = await p.evaluate(() => [...document.querySelectorAll(".pastas-empresa")][0] && [...document.querySelectorAll(".pastas-empresa")[0].querySelectorAll(".pastas-cel")].map((e) => Math.round(e.getBoundingClientRect().top)));
  console.log(w, "topos das pastas da 1a empresa:", tops);
  for (const i of [0, 4]) {
    await p.locator(".pastas-empresa").first().locator(".gf-hit").nth(i).click();
    await p.waitForTimeout(1200);
    const m = await p.evaluate(() => { const e = document.querySelector(".pastas-empresa"); const h = e.querySelector("h2").getBoundingClientRect().bottom; const t = Math.min(...[...e.querySelectorAll(".gf-root[data-open] .gf-sheet")].map((s) => s.getBoundingClientRect().top)); return [Math.round(h), Math.round(t)]; });
    console.log(w, "pasta", i, "h2 bottom / topo do cartão mais alto:", m);
    await marca();
    await p.screenshot({ path: join(PASTA, `10-aberta${i}-${w}.png`) });
    await p.mouse.click(w - 4, h - 4); await p.waitForTimeout(500);
  }
  await p.close();
}
await nav.close();
