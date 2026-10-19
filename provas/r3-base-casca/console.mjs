// Prova do console limpo + menu recolhido. Dev ligado em 3100: node provas/r3-base-casca/console.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const BASE = "http://127.0.0.1:3100";
const nav = await chromium.launch({ headless: true });
const ctx = await nav.newContext({ viewport: { width: 1440, height: 760 } });
const p = await ctx.newPage();
let erros = [];
p.on("console", (m) => ["error", "warning"].includes(m.type()) && erros.push(`${m.type()}: ${m.text()}`));
p.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
const overlay = () => p.evaluate(() => {
  const r = document.querySelector("nextjs-portal")?.shadowRoot;
  return r ? (() => { const d = document.createElement("div"); [...r.children].filter((e) => e.tagName !== "STYLE").forEach((e) => d.append(e.cloneNode(true))); d.querySelectorAll("style").forEach((e) => e.remove()); return [d.textContent.replace(/\s+/g, " ").trim().slice(0, 200)]; })() : [];
});
// instrumento: provoca um erro e confere que é capturado
await p.goto(BASE + "/", { waitUntil: "networkidle" });
await p.evaluate(() => { console.error("TESTE-INSTRUMENTO"); setTimeout(() => { throw new Error("TESTE-PAGEERROR"); }); });
await p.waitForTimeout(500);
console.log("overlay após erro provocado:", await overlay());
console.log("instrumento captura:", erros.some((e) => e.includes("TESTE-INSTRUMENTO")) && erros.some((e) => e.includes("TESTE-PAGEERROR")));
for (const rota of ["/", "/calendario", "/mapa", "/tarefas", "/pastas", "/conteudos", "/configuracoes"]) {
  erros = [];
  await p.goto(BASE + rota, { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  console.log(rota, erros.length ? erros : "console limpo", "overlay:", await overlay());
}
// menu recolhido lembrado
await p.evaluate(() => localStorage.setItem("grade:menu-recolhido", "1"));
await p.goto(BASE + "/tarefas", { waitUntil: "commit" });
await p.waitForTimeout(100);
console.log("data-menu cedo:", await p.evaluate(() => document.documentElement.dataset.menu));
await p.waitForLoadState("networkidle"); await p.waitForTimeout(1500);
await p.evaluate(() => { const s = document.createElement("div"); s.textContent = `innerWidth ${innerWidth} | data-menu ${document.documentElement.dataset.menu}`; s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#111;color:#fc3;font:700 13px monospace;padding:3px 8px"; document.body.append(s); });
await p.screenshot({ path: join(PASTA, "menu-recolhido-1440.png") });
await nav.close();
