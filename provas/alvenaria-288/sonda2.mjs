// Simula a extensão de tradução: mexe no texto antes do React hidratar (causa o mesmo que o print dele).
import { createRequire } from "node:module";
import { join } from "node:path";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const p = await nav.newPage({ viewport: { width: 1440, height: 760 } });
const msgs = [];
p.on("console", (m) => msgs.push(`${m.type()}: ${m.text().slice(0, 200)}`));
if (process.argv[2] === "mexe") await p.addInitScript(() => {
  new MutationObserver((_, o) => { const n = document.querySelector("nav, aside, main"); if (n) { const f = document.createElement("font"); f.textContent = "x"; n.prepend(f); o.disconnect(); } }).observe(document, { childList: true, subtree: true });
});
await p.goto("http://127.0.0.1:3221/entrar", { waitUntil: "networkidle" }).catch(() => {});
await p.goto("http://127.0.0.1:3121/entrar", { waitUntil: "networkidle" });
await p.waitForTimeout(2500);
console.log(msgs.filter((m) => !/WebSocket|DevTools|HMR/.test(m)).join("\n") || "(console limpo)");
await nav.close();
