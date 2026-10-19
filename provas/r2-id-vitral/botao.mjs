// Prova do botao .gf-todas (min-height 44px). Servidor em 3101: node provas/r2-id-vitral/botao.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const p = await (await nav.newContext({ viewport: { width: 1440, height: 760 } })).newPage();
await p.goto("http://localhost:3101/pastas", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
const b = p.locator(".gf-todas").first();
await b.scrollIntoViewIfNeeded();
const h = await b.evaluate((e) => e.getBoundingClientRect().height);
await p.evaluate((h) => { const s = document.createElement("div"); s.textContent = `innerWidth ${innerWidth} | botao ${h}px`; s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px"; document.body.append(s); }, h);
await p.screenshot({ path: join(PASTA, "id-1440-pastas-botao.png") });
await nav.close();
console.log("altura do botao", h);
