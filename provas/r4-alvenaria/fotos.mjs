// Fotos da rodada 4 (Mapa + calendário). Servidor em 3100 ligado. Janela fora da tela, sem tocar mouse/teclado.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const marca = (p) => p.evaluate(() => { document.getElementById("marca")?.remove(); const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth + " | scrollY " + Math.round(scrollY); d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px"; d.id = "marca"; document.body.append(d); });
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  const erros = [];
  p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  p.on("pageerror", (e) => erros.push(String(e)));
  await p.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  const info = await p.evaluate(() => { const c = document.querySelector(".mapa-cartao").getBoundingClientRect(); const t = document.querySelector(".mapa-palco").getBoundingClientRect(); return { cartaoTopo: c.top, cartaoBase: c.bottom, innerHeight, sobreposicao: (() => { const bs = [...document.querySelectorAll(".mapa-bloco")].map((b) => b.getBoundingClientRect()); let n = 0; for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i], b = bs[j]; if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) n++; } return n; })(), cortados: [...document.querySelectorAll(".mapa-bloco")].filter((b) => b.scrollHeight > b.clientHeight + 1).length, marcos: document.querySelectorAll("[data-marco]").length }; });
  console.log(w, JSON.stringify(info));
  const alto = await p.evaluate(() => document.querySelector(".mapa-palco").offsetHeight - document.querySelector(".mapa-fixo").offsetHeight);
  const meio = await p.evaluate(() => { const m = [...document.querySelectorAll("[data-marco]")]; return m[Math.floor(m.length / 2)].offsetLeft - innerWidth * 0.35; });
  for (const [nome, y] of [["inicio", 0], ["rolou-100px", 100], ["meio", meio], ["fim", alto]]) {
    await p.evaluate((y) => scrollTo(0, y), y);
    await p.waitForTimeout(1800);
    await marca(p);
    // sobreposição entre blocos visíveis na tela
    const ov = await p.evaluate(() => { const bs = [...document.querySelectorAll(".mapa-bloco")].map((b) => b.getBoundingClientRect()).filter((r) => r.right > 0 && r.left < innerWidth); let n = 0; for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i], b = bs[j]; if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) n++; } return n; });
    console.log(w, nome, "blocos sobrepostos na tela:", ov, "| scrollWidth==clientWidth:", await p.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth));
    await p.screenshot({ path: join(PASTA, `mapa-${w}-${nome}.png`) });
  }
  console.log(w, "erros de console:", erros.length ? erros : "nenhum");
  await p.close();
}
const r = await nav.newPage({ viewport: { width: 1440, height: 760 }, reducedMotion: "reduce" });
await r.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" });
await r.waitForTimeout(800);
await marca(r);
await r.screenshot({ path: join(PASTA, "mapa-1440-movimento-reduzido.png") });
await r.close();
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const c = await nav.newPage({ viewport: { width: w, height: h } });
  await c.goto("http://localhost:3100/calendario", { waitUntil: "networkidle" });
  await c.waitForTimeout(1200);
  await marca(c);
  await c.screenshot({ path: join(PASTA, `calendario-${w}.png`) });
  await c.close();
}
await nav.close();
