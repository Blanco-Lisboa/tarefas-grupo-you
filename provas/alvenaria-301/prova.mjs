// 301: a extensão de tradução simulada injeta uma div (class translate-tooltip-mtz translator-hidden, texto em branco) no corpo antes do React hidratar.
// Roda: node prova.mjs <foto> [url]. Esperado: ANTES do conserto, hydration > 0; DEPOIS, 0.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const URL_ = process.argv[3] ?? "http://127.0.0.1:3131/entrar";
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const p = await nav.newPage({ viewport: { width: 1440, height: 760 } });
const msgs = [];
p.on("console", (m) => msgs.push(`${m.type()}: ${m.text()}`));
p.on("pageerror", (e) => msgs.push("pageerror: " + e));
await p.addInitScript(() => {
  window.__marcou = 0;
  // injeta assim que o <body> existe, antes de qualquer script da página
  const injeta = () => {
    if (!document.body || window.__marcou) return;
    const d = document.createElement("div");
    d.className = "translate-tooltip-mtz translator-hidden";
    d.textContent = "\n   ";
    document.body.prepend(d);
    window.__marcou++;
  };
  new MutationObserver(injeta).observe(document, { childList: true, subtree: true });
});
await p.goto(URL_, { waitUntil: "networkidle" }).catch(() => {});
let hyd = 0;
for (let i = 1; i <= 3; i++) {
  msgs.length = 0;
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  await p.evaluate(() => console.error("PROVA-CAPTURA: erro de propósito"));
  await p.waitForTimeout(200);
  const marcou = await p.evaluate(() => window.__marcou);
  const h = msgs.filter((m) => /hydrat|did not match/i.test(m));
  hyd += h.length;
  console.log(`recarga ${i}: divs injetadas=${marcou} hydration=${h.length} capturou=${msgs.some((m) => m.includes("PROVA-CAPTURA"))}`);
  if (h[0] && i === 1) console.log(h[0].slice(0, 300));
}
await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;top:8px;z-index:99999;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
await p.screenshot({ path: PASTA + (process.argv[2] ?? "foto") + ".png" });
console.log("TOTAL hydration:", hyd);
await nav.close();
