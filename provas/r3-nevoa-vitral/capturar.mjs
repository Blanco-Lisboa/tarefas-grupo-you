// Prova das Pastas na Névoa (item 60, Fase 2). Servidor em 3100 ligado: node provas/r3-nevoa-vitral/capturar.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const erros = [];
const navegador = await chromium.launch({ headless: true });
const marcar = (p) => p.evaluate(() => {
  const s = document.createElement("div");
  const abertas = [...document.querySelectorAll(".gf-root[data-open]")];
  const fora = abertas.flatMap((r) => { const b = r.getBoundingClientRect(); return [...r.querySelectorAll(".gf-sheet")].filter((f) => { const q = f.getBoundingClientRect(); return q.left < b.left - 0.5 || q.right > b.right + 0.5; }); }).length;
  s.textContent = `innerWidth ${innerWidth} · scrollWidth ${document.documentElement.scrollWidth} / clientWidth ${document.documentElement.clientWidth} · folhas fora da pasta ${fora}`;
  s.style.cssText = "position:fixed;right:6px;top:6px;z-index:99999;background:#1D1D1F;color:#fff;font:700 13px monospace;padding:3px 8px;pointer-events:none";
  document.body.append(s);
});
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const c = await navegador.newContext({ viewport: { width: w, height: h } });
  const p = await c.newPage();
  p.on("console", (m) => m.type() === "error" && !m.text().includes("WebSocket") && erros.push(`[${w}] console: ${m.text()}`));
  p.on("pageerror", (e) => erros.push(`[${w}] pageerror: ${e.message}`));
  await p.goto("http://localhost:3100/pastas", { waitUntil: "networkidle" });
  await p.waitForSelector("canvas.gf-art[data-ready]", { timeout: 15000 });
  await p.waitForTimeout(2500);
  const larg = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (larg > 0) erros.push(`[${w}] página rola na horizontal (${larg}px)`);
  await marcar(p);
  await p.evaluate(() => document.querySelector("body > div:last-child")?.remove());
  await p.screenshot({ path: join(PASTA, `${w}-pastas.png`), fullPage: false });
  await p.locator(".gf-hit").first().click();
  await p.mouse.move(2, 2);
  await p.waitForTimeout(1800);
  const m = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  console.log(w, "aberta scrollWidth/clientWidth", m.join("/"));
  await marcar(p);
  await p.screenshot({ path: join(PASTA, `${w}-pastas-aberta.png`), fullPage: false });
  await c.close();
}
console.log(erros.length ? erros.join("\n") : "sem erros");
await navegador.close();
