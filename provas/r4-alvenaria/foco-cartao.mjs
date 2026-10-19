// Item 77: cartão do Mapa com foco de teclado (contorno da base). Servidor em 3100 ligado.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const { chromium } = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"))("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const n = await chromium.launch(); const p = await n.newPage({ viewport: { width: 1440, height: 760 } });
await p.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" }); await p.waitForTimeout(2200);
await p.keyboard.press("Tab"); // entra no teclado para o :focus-visible valer
await p.locator('[data-marco][data-dia="2026-10-19"] .mapa-card').first().focus(); await p.waitForTimeout(500);
console.log(await p.evaluate(() => { const c = getComputedStyle(document.activeElement); return `outline: ${c.outlineWidth} ${c.outlineStyle} ${c.outlineColor}, offset ${c.outlineOffset}`; }));
await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
await p.screenshot({ path: join(PASTA, "foco-cartao-1440.png") });
await n.close();
