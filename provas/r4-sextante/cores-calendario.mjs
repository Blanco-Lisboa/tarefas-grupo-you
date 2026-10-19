// Prova do item 78 (Sextante): bloco do calendário na cor clara da empresa + etiqueta da etapa. 1440 e 390.
// Também abre as Pastas para conferir que a cor das pastas (mesmo módulo, @/lib/cores-empresa) não quebrou.
// Chrome headless (fora da tela), servidor em 3100.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

const PASTA = fileURLToPath(new URL("./", import.meta.url));
const erros = [];
const b = await chromium.launch();
const foto = async (p, nome, cheia = false) => {
  await p.evaluate(() => {
    document.getElementById("prova-iw")?.remove();
    const s = document.createElement("div");
    s.id = "prova-iw";
    s.textContent = `innerWidth ${innerWidth}`;
    s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#000;color:#fff;font:700 13px monospace;padding:3px 8px;pointer-events:none";
    document.body.append(s);
  });
  await p.screenshot({ path: join(PASTA, nome), fullPage: cheia });
};
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on("console", (m) => m.type() === "error" && !m.text().includes("WebSocket") && erros.push(`[${w}] console: ${m.text()}`));
  p.on("pageerror", (e) => erros.push(`[${w}] pageerror: ${e.message}`));
  await p.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  const fundos = await p.evaluate(() => [...new Set([...document.querySelectorAll(".evento")].map((e) => getComputedStyle(e).backgroundColor))]);
  const etapas = await p.locator(".evento .etapa").count();
  console.log(`[${w}] fundos dos blocos: ${fundos.join(" | ")} · etiquetas de etapa: ${etapas}`);
  if (!etapas) erros.push(`[${w}] nenhuma etiqueta de etapa`);
  await p.evaluate(() => document.querySelector(".cal-painel, .cal-grade")?.scrollIntoView({ block: "start" }));
  await foto(p, `${w}-cal-cores-semana.png`);
  if (w === 1440) {
    await p.keyboard.press("m");
    await p.waitForTimeout(400);
    await foto(p, "1440-cal-cores-mes.png");
    await p.goto("http://127.0.0.1:3100/pastas", { waitUntil: "networkidle" });
    await p.waitForTimeout(2500);
    await foto(p, "1440-pastas-cores-depois.png");
  }
}
await b.close();
console.log(erros.length ? erros.join("\n") : "sem erros");
