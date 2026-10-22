// 282: sem "script tag while rendering" no console e menu recolhido valendo já na 1ª pintura. Cópia de exemplo própria em 3121/3221.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const p = await nav.newPage({ viewport: { width: 1440, height: 760 } });
const erros = [];
p.on("console", (m) => { if (m.type() === "error") erros.push(m.text()); });
p.on("pageerror", (e) => erros.push(String(e)));
await p.addInitScript(() => { requestAnimationFrame(() => { window.__menuNaPrimeiraPintura = document.documentElement.dataset.menu ?? "(aberto)"; }); });
await p.goto("http://127.0.0.1:3221/entrar", { waitUntil: "networkidle" });
await p.goto("http://127.0.0.1:3121/conteudos", { waitUntil: "networkidle" });
await p.waitForTimeout(2500);
await p.evaluate(() => localStorage.setItem("grade:menu-recolhido", "1"));
for (let i = 1; i <= 3; i++) {
  await p.reload({ waitUntil: "networkidle" });
  console.log(`recarga ${i}: data-menu na 1ª pintura =`, await p.evaluate(() => window.__menuNaPrimeiraPintura));
}
const html = await (await p.request.get("http://127.0.0.1:3121/conteudos")).text();
console.log("script inline no HTML do servidor:", html.includes('grade:menu-recolhido'));
await p.waitForTimeout(1500);
await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;top:8px;z-index:99999;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
await p.screenshot({ path: PASTA + "menu-recolhido-1440.png" });
console.log("erros do console:", erros.filter((e) => /script tag/i.test(e)).length, "(total de erros:", erros.length + ")");
if (erros.length) console.log(erros.slice(0, 3));
await nav.close();
