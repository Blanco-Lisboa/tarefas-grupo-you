import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const SAIDA = fileURLToPath(new URL("../../docs/referencias/2026-10-19-rodada-4/", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const tela of ["conteudos", "calendario", "tarefas", "mapa"]) {
  for (const [w, h] of [[1440, 760], [390, 844]]) {
    const p = await nav.newPage({ viewport: { width: w, height: h } });
    await p.goto("http://localhost:3100/" + tela, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
    await p.screenshot({ path: join(SAIDA, `59-pessoas-${tela}-${w}.png`) });
    await p.close();
  }
}
await nav.close();
