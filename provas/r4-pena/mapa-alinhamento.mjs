// Item 90: fotos do topo do Mapa (a 1440 e 390) e medidas de alinhamento no navegador. Uso: node mapa-alinhamento.mjs <antes|depois>. Servidor em 3100 ligado.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const DESTINO = fileURLToPath(new URL("../../docs/referencias/2026-10-19-rodada-4/", import.meta.url));
const quando = process.argv[2] ?? "antes";
const nav = await chromium.launch({ headless: true });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" });
  await p.waitForTimeout(2200);
  const m = await p.evaluate(() => {
    const r = (e) => { const b = e.getBoundingClientRect(); return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), r: +b.right.toFixed(1), b: +b.bottom.toFixed(1), h: +b.height.toFixed(1) }; };
    const q = (s) => document.querySelector(s);
    const base = (dd) => { const s = document.createElement("span"); s.style.cssText = "display:inline-block;width:0;height:0"; dd.append(s); const y = s.getBoundingClientRect().bottom; s.remove(); return +y.toFixed(1); };
    const itens = [...document.querySelectorAll(".mapa-resumo > div")].map((d) => ({ base: base(d.querySelector("dd")), dt: r(d.querySelector("dt")), dd: r(d.querySelector("dd")), caixa: r(d), peso: getComputedStyle(d.querySelector("dd")).fontWeight }));
    return { h1: r(q(".mapa-titulo h1")), sub: r(q(".mapa-titulo p")), resumo: r(q(".mapa-resumo")), itens, cartao: r(q(".mapa-cartao")), dica: q(".mapa-dica") && r(q(".mapa-dica")), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth };
  });
  console.log(w, JSON.stringify(m));
  await p.evaluate((t) => { const d = document.createElement("div"); d.textContent = t; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px"; document.body.append(d); }, `innerWidth ${w}`);
  await p.screenshot({ path: join(DESTINO, `44-mapa-resumo-${quando}-${w}.png`), clip: { x: 0, y: 0, width: w, height: Math.min(h, 330) } });
}
await nav.close();
