// 288: dev (3121, banco falso 3221) sem "script tag while rendering" e menu recolhido sem piscar. Roda: node prova.mjs <nome-da-foto>
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const p = await nav.newPage({ viewport: { width: 1440, height: 760 } });
const msgs = [];
p.on("console", (m) => msgs.push(`${m.type()}: ${m.text()}`));
p.on("pageerror", (e) => msgs.push("pageerror: " + e));
// guarda: data-menu em TODO quadro de pintura (pega piscada) e se o <script> existe no DOM
await p.addInitScript(() => {
  window.__q = [];
  const f = () => { window.__q.push(document.documentElement.dataset.menu ?? "(aberto)"); if (window.__q.length < 60) requestAnimationFrame(f); };
  requestAnimationFrame(f);
});
await p.goto("http://127.0.0.1:3221/entrar", { waitUntil: "networkidle" }).catch(() => {});
await p.goto("http://127.0.0.1:3121/entrar", { waitUntil: "networkidle" });
await p.evaluate(() => { localStorage.setItem("grade:menu-recolhido", "1"); console.error("PROVA-CAPTURA: erro de propósito"); });
for (let i = 1; i <= 3; i++) {
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const q = await p.evaluate(() => window.__q);
  console.log(`recarga ${i}: quadros=${q.length} abertos=${q.filter((x) => x !== "recolhido").length} 1º=${q[0]} último=${q.at(-1)}`);
}
console.log("recolhido final:", await p.evaluate(() => document.documentElement.dataset.menu));
await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;top:8px;z-index:99999;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
await p.screenshot({ path: PASTA + (process.argv[2] ?? "foto") + ".png" });
console.log("capturou o erro de propósito:", msgs.some((m) => m.includes("PROVA-CAPTURA")));
console.log("avisos 'script tag':", msgs.filter((m) => /script tag/i.test(m)).length);
console.log("hydration:", msgs.filter((m) => /hydrat|did not match/i.test(m)).length);
console.log("outros erros:", msgs.filter((m) => m.startsWith("error") && !/PROVA-CAPTURA|script tag/i.test(m)).slice(0, 3));
await nav.close();
