import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const telas = (process.argv[2] || "calendario,mapa,conteudos,pastas").split(",");
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const tela of telas) for (const [w, h] of [[1903, 910], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/" + tela, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const m = await p.evaluate(() => {
    const c = (e) => { const r = e.getBoundingClientRect(); return Math.round((r.top + r.height / 2) * 10) / 10; };
    const h1 = document.querySelector("main h1");
    const filtro = [...document.querySelectorAll("main button")].find((b) => /Empresa/.test(b.textContent + (b.getAttribute("aria-label") || "") + (b.title || "")));
    const outros = [...document.querySelectorAll("main button.btn, main .btn")].slice(0, 4).map((e) => [(e.textContent || "").trim().slice(0, 12), c(e)]);
    const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d);
    const de = document.documentElement;
    return { h1: c(h1), h1Top: h1.getBoundingClientRect().top, filtro: filtro && c(filtro), outros, scrollH: de.scrollHeight, clientH: de.clientHeight, scrollW: de.scrollWidth, barraCasca: !!document.querySelector(".casca-barra") };
  });
  console.log(tela, w, JSON.stringify(m));
  await p.screenshot({ path: join(PASTA, `110-${tela}-${w}.png`) });
  await p.close();
}
await nav.close();
