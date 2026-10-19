import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/pastas", { waitUntil: "networkidle" });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;top:8px;z-index:99999;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
  await p.screenshot({ path: join(PASTA, `12-cores-marca-${w}.png`) });
  if (w === 1440) {
    // contraste do texto da pasta: mede o fundo atrás do texto (texto escondido) e compara com a cor do texto
    for (const emp of [0, 1]) for (const [cls, rot] of [[".gf-title", "titulo"], [".gf-meta", "meta"]]) {
      const el = p.locator(".pastas-empresa").nth(emp).locator(cls).first();
      await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
      const box = await el.boundingBox();
      const cor = await el.evaluate((e) => getComputedStyle(e).color);
      await el.evaluate((e) => (e.style.visibility = "hidden"));
      const png = await p.screenshot({ clip: { x: box.x, y: box.y, width: Math.max(2, box.width), height: box.height } });
      await el.evaluate((e) => (e.style.visibility = ""));
      const px = await p.evaluate(async (b64) => { const im = new Image(); im.src = "data:image/png;base64," + b64; await im.decode(); const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const x = c.getContext("2d"); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let min = 1e9, pior = null; for (let i = 0; i < d.length; i += 4) { const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; if (l < min) { min = l; pior = [d[i], d[i + 1], d[i + 2]]; } } return pior; }, png.toString("base64"));
      const t = cor.match(/\d+/g).slice(0, 3).map(Number);
      const [a, b] = [lum(px), lum(t)].sort((x, y) => y - x);
      console.log(["Beec", "You"][emp], rot, "texto", cor, "fundo mais escuro", px, "contraste", ((a + 0.05) / (b + 0.05)).toFixed(2));
    }
  }
  await p.close();
}
await nav.close();
