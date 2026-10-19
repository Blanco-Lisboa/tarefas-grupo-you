// Prova do item 68 (Sextante): item do menu "Tarefas" vira "Caderno"; nome do sistema e rota /tarefas ficam.
// Chrome headless, servidor em 3100. Fotos do menu aberto e recolhido em 1440, e 390 (só ícones).
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

const PASTA = fileURLToPath(new URL("./", import.meta.url));
const erros = [];
const b = await chromium.launch();
const foto = async (p, nome) => {
  await p.evaluate(() => {
    document.getElementById("prova-iw")?.remove();
    const s = document.createElement("div");
    s.id = "prova-iw";
    s.textContent = `innerWidth ${innerWidth}`;
    s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#000;color:#fff;font:700 13px monospace;padding:3px 8px;pointer-events:none";
    document.body.append(s);
  });
  await p.screenshot({ path: join(PASTA, nome) });
};
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on("pageerror", (e) => erros.push(`[${w}] pageerror: ${e.message}`));
  await p.goto("http://127.0.0.1:3100/tarefas", { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  const item = p.locator('.menu a[href="/tarefas"]');
  if ((await item.getAttribute("title")) !== "Caderno") erros.push(`[${w}] title: ${await item.getAttribute("title")}`);
  if ((await item.getAttribute("aria-current")) !== "page") erros.push(`[${w}] item não está ativo em /tarefas`);
  if ((await p.locator(".menu-nome").innerText()) !== "Tarefas") erros.push(`[${w}] nome do sistema mudou`);
  if (w === 390) { await foto(p, "390-menu-caderno.png"); continue; }
  if ((await item.innerText()) !== "Caderno") erros.push(`[${w}] rótulo: ${await item.innerText()}`);
  await foto(p, "1440-menu-caderno.png");
  await p.locator(".menu-alterna").click();
  await p.waitForTimeout(400);
  await item.hover(); // mostra o "Caderno" do title no recolhido
  await foto(p, "1440-menu-caderno-recolhido.png");
}
await b.close();
console.log(erros.length ? erros.join("\n") : "sem erros");
