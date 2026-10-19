import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1903, 910], [1440, 900], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/pastas", { waitUntil: "networkidle" });
  await p.waitForTimeout(2200);
  const m = await p.evaluate(() => {
    const d = document.scrollingElement, c = document.querySelector(".casca-conteudo");
    return { doc: [d.scrollHeight, d.clientHeight], conteudo: [c.scrollHeight, c.clientHeight], ultimaBase: Math.round(document.querySelector(".pastas-empresa:last-of-type .gf-root:last-of-type")?.getBoundingClientRect().bottom ?? 0) };
  });
  console.log(w, h, JSON.stringify(m));
  await p.evaluate(() => { const x = document.createElement("div"); x.textContent = "innerWidth " + innerWidth; x.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(x); });
  await p.screenshot({ path: join(PASTA, `109-${w}.png`) });
  await p.close();
}
await nav.close();
