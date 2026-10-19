// Item 90: pente fino do Mapa. Mede no navegador centros da haste, bolinha, rótulo do dia, bloco e linha. Servidor em 3100 ligado.
import { createRequire } from "node:module";
import { join } from "node:path";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const nav = await chromium.launch({ headless: true });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" });
  await p.waitForTimeout(2200);
  console.log(w, JSON.stringify(await p.evaluate(() => {
    const c = (e) => { const b = e.getBoundingClientRect(); return +((b.left + b.right) / 2).toFixed(1); };
    const cy = (e) => { const b = e.getBoundingClientRect(); return +((b.top + b.bottom) / 2).toFixed(1); };
    const linha = document.querySelector(".mapa-linha"), cartao = document.querySelector(".mapa-cartao").getBoundingClientRect();
    const marcos = [...document.querySelectorAll(".mapa-marco")].slice(0, 4).map((m) => {
      const b = m.getBoundingClientRect(), haste = m.querySelector(".mapa-haste"), bol = m.querySelector(".mapa-bolinha");
      return { haste: c(haste), bol: c(bol), x: +b.left.toFixed(1), lado: m.dataset.lado };
    });
    const dias = [...document.querySelectorAll(".mapa-dia")].slice(0, 4).map((d) => ({ c: c(d) }));
    return { linhaY: cy(linha), cartaoMeioY: +((cartao.top + cartao.bottom) / 2).toFixed(1), marcos, dias };
  })));
}
await nav.close();
