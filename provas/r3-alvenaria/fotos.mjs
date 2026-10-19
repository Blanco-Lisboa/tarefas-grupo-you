// Fotos do Mapa (item 58): início, meio e fim da rolagem em 1440x760 e 390x844, mais movimento reduzido. Servidor em 3100 ligado.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const marca = (p) => p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth + " | scrollY " + Math.round(scrollY); d.style.cssText = "position:fixed;right:8px;top:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px"; d.id = "marca"; document.body.append(d); });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  const erros = [];
  p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  p.on("pageerror", (e) => erros.push(String(e)));
  await p.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" });
  await p.waitForTimeout(2200);
  const { topo, alto } = await p.evaluate(() => { const e = document.querySelector(".mapa-palco"); return { topo: e.getBoundingClientRect().top + scrollY, alto: e.offsetHeight - innerHeight }; });
  console.log(w, "palco topo", topo, "percurso", alto, "marcos", await p.locator("[data-marco]").count());
  // meio = o marco do meio da lista parado a 35% da largura da tela (já revelado)
  const meio = await p.evaluate(() => { const m = [...document.querySelectorAll("[data-marco]")]; return m[Math.floor(m.length / 2)].offsetLeft - innerWidth * 0.35; });
  for (const [nome, y] of [["inicio", 0], ["meio", meio], ["fim", alto]]) {
    await p.evaluate((y) => scrollTo(0, y), topo + y);
    await p.waitForTimeout(1800);
    await p.evaluate(() => document.getElementById("marca")?.remove());
    await marca(p);
    // cada marco tem que ficar sobre o rótulo do seu dia: diferença do centro em px
    const desvio = await p.evaluate(() => [...document.querySelectorAll("[data-marco]")].map((m) => { const x = m.getBoundingClientRect().left; const d = m.dataset.dia; const r = document.querySelector(`.mapa-dia[data-dia="${d}"]`).getBoundingClientRect(); return Math.abs(x - (r.left + r.width / 2)); }).reduce((a, b) => Math.max(a, b), 0));
    console.log(w, nome, "maior desvio marco x rótulo (px):", desvio.toFixed(2));
    await p.screenshot({ path: join(PASTA, `mapa-${w}-${nome}.png`) });
  }
  console.log(w, "erros de console:", erros.length ? erros : "nenhum");
  await p.close();
}
const r = await nav.newPage({ viewport: { width: 1440, height: 760 }, reducedMotion: "reduce" });
await r.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" });
await r.waitForTimeout(800);
await r.evaluate(() => document.querySelector(".mapa-fixo").scrollTo(2500, 0));
await r.waitForTimeout(300);
await r.evaluate(() => document.querySelector(".mapa-fixo").scrollIntoView());
await marca(r);
await r.screenshot({ path: join(PASTA, "mapa-1440-movimento-reduzido.png") });
console.log("reduzido: faixa rola", await r.evaluate(() => { const f = document.querySelector(".mapa-fixo"); return f.scrollWidth > f.clientWidth; }));
await nav.close();
