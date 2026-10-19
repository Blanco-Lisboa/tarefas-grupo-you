// Dia com 3 postagens: nenhum cartão escondido (scrollHeight <= clientHeight) e foto em 1440 e 390. Servidor em 3100 ligado.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  for (const lado of ["cima", "baixo"]) {
    const alvo = await p.evaluate((lado) => { const m = [...document.querySelectorAll("[data-marco]")].filter((x) => x.dataset.lado === lado && x.querySelectorAll(".mapa-card").length === 3); return m.length ? { dia: m[Math.floor(m.length / 2)].dataset.dia, x: m[Math.floor(m.length / 2)].offsetLeft } : null; }, lado);
    if (!alvo) { console.log(w, h, lado, "nenhum dia com 3 neste lado"); continue; }
    await p.evaluate((x) => scrollTo(0, x - innerWidth * (innerWidth > 800 ? 0.3 : 0.12)), alvo.x);
    await p.waitForTimeout(1800);
    const r = await p.evaluate(() => {
      const bs = [...document.querySelectorAll(".mapa-bloco")];
      return { escondidos: bs.filter((b) => b.scrollHeight > b.clientHeight + 1).length, total: bs.length };
    });
    console.log(w, h, lado, alvo.dia, JSON.stringify(r));
    await p.evaluate(() => { document.getElementById("marca")?.remove(); const d = document.createElement("div"); d.id = "marca"; d.textContent = "innerWidth " + innerWidth + " | scrollY " + Math.round(scrollY); d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
    await p.screenshot({ path: join(PASTA, `dia-3-postagens-${w}x${h}-${lado}.png`) });
  }
  await p.close();
}
await nav.close();
