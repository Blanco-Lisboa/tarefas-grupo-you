import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const L = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const CR = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const CANDS = { azul: [0, 100, 204], branco: [255, 255, 255], escuro: [29, 29, 31] };
const p = await nav.newPage({ viewport: { width: 1440, height: 760 } });
await p.goto("http://localhost:3100/pastas", { waitUntil: "networkidle" });
await p.waitForTimeout(3500);
const marca = () => p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;top:8px;z-index:99999;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
// amostra a faixa de 2px junto da borda do elemento (sem foco), pior caso entre os pixels
async function faixa(box) {
  const png = await p.screenshot({ clip: box });
  return p.evaluate(async (b64) => { const im = new Image(); im.src = "data:image/png;base64," + b64; await im.decode(); const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const x = c.getContext("2d"); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; const out = []; const t = 3; for (let yy = 0; yy < c.height; yy++) for (let xx = 0; xx < c.width; xx++) if (xx < t || yy < t || xx >= c.width - t || yy >= c.height - t) { const i = (yy * c.width + xx) * 4; out.push([d[i], d[i + 1], d[i + 2]]); } return out; }, png.toString("base64"));
}
for (const emp of [0, 1]) {
  const nome = ["You", "Beec"][emp];
  const hit = p.locator(".pastas-empresa").nth(emp).locator(".gf-hit").first();
  await hit.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  const bx = await hit.boundingBox();
  // faixa do contorno da pasta: 5 a 7px para dentro da borda (outline-offset -6) e logo fora (offset 1)
  const dentro = await faixa({ x: bx.x + 5, y: bx.y + 5, width: bx.width - 10, height: bx.height - 10 });
  const fora = await faixa({ x: bx.x - 3, y: bx.y - 3, width: bx.width + 6, height: bx.height + 6 });
  for (const [rot, px] of [["dentro(-6)", dentro], ["fora(+1)", fora]]) for (const [k, c] of Object.entries(CANDS)) {
    const rs = px.map((q) => CR(c, q)).sort((a, b) => a - b);
    console.log(nome, "pasta", rot, k, "p10", rs[Math.floor(rs.length * 0.1)].toFixed(2), "mediana", rs[Math.floor(rs.length / 2)].toFixed(2));
  }
}
await nav.close();
