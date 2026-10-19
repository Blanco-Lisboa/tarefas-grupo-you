// Zoom 3x na borda de baixo do cartão de 1 e da pilha de 3 (item 82). Servidor em 3100 ligado.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const { chromium } = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"))("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const n = await chromium.launch();
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const c = await n.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3 }); const p = await c.newPage();
  await p.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" }); await p.waitForTimeout(2200);
  const zoom = async (sel, nome) => { const b = await p.locator(sel).first().boundingBox(); await p.screenshot({ path: join(PASTA, `zoom-borda-${nome}-${w}.png`), clip: { x: Math.max(0, b.x - 24), y: b.y - 8, width: Math.min(b.width + 60, w - Math.max(0, b.x - 24)), height: b.height + 40 } }); };
  await zoom('[data-marco][data-dia="2026-10-19"] .mapa-card', "dia-de-1");
  await zoom('[data-marco][data-dia="2026-10-20"] .mapa-pilha', "pilha-de-3");
  await c.close();
}
await n.close();
