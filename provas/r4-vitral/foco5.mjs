import { createRequire } from "node:module";
import { join } from "node:path";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const p = await nav.newPage({ viewport: { width: 1440, height: 760 } });
await p.goto("http://localhost:3100/pastas", { waitUntil: "networkidle" });
await p.waitForTimeout(3000);
const out = () => p.evaluate(() => { const a = document.activeElement, c = getComputedStyle(a); return `${a.className.split(" ")[0] || a.tagName} outline ${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`; });
const hit = p.locator(".gf-hit").first(); await hit.focus(); await p.keyboard.press("Shift+Tab"); await p.keyboard.press("Tab");
console.log(await out());
await p.keyboard.press("Enter"); await p.waitForTimeout(1000);
await p.locator(".gf-root[data-open] .gf-sheet").last().click({ force: true });
await p.waitForSelector("dialog[open]");
for (let i = 0; i < 4; i++) { await p.keyboard.press("Tab"); console.log(await out()); }
await nav.close();
