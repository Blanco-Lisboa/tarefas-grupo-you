// Mapa em tela (a rolagem do Mapa faz a foto de página inteira sair vazia): node provas/r3-final-check/mapa-viewport.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await (await nav.newContext({ viewport: { width: w, height: h } })).newPage();
  await p.goto("http://127.0.0.1:3100/mapa", { waitUntil: "networkidle" });
  for (const [nome, f] of [["inicio", 0], ["meio", 0.5], ["fim", 1]]) {
    await p.evaluate((f) => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), f);
    await p.waitForTimeout(1200);
    await p.evaluate(() => { document.getElementById("__m")?.remove(); const s = document.createElement("div"); s.id = "__m"; const d = document.documentElement; s.textContent = `innerWidth ${innerWidth} · scrollWidth ${d.scrollWidth} / clientWidth ${d.clientWidth}`; s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#1D1D1F;color:#fff;font:700 12px monospace;padding:3px 8px"; document.body.append(s); });
    await p.screenshot({ path: join(PASTA, `${w}-mapa-${nome}.png`) });
  }
}
await nav.close();
