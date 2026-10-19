// Prova da tela Tarefas (rodada 2, Pena). Servidor em 3100 ligado: node provas/r2-pena/capturar.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

const BASE = "http://localhost:3100";
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const DIA = process.argv[2] ?? "2026-10-21";
const erros = [];
const marcar = (p) => p.evaluate(() => {
  const s = document.createElement("div");
  s.textContent = `innerWidth ${innerWidth}`;
  s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px;pointer-events:none";
  document.body.append(s);
});

const navegador = await chromium.launch({ headless: true });
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const p = await (await navegador.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on("console", (m) => m.type() === "error" && !m.text().includes("WebSocket") && erros.push(`[${w}] console: ${m.text()}`));
  p.on("pageerror", (e) => erros.push(`[${w}] pageerror: ${e.message}`));
  await p.goto(`${BASE}/tarefas`, { waitUntil: "networkidle" });
  await p.locator(".tarefas-data").fill(DIA);
  await p.waitForTimeout(500);
  const larg = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (larg > 0) erros.push(`[${w}] rola na horizontal (${larg}px)`);
  await marcar(p);
  await p.screenshot({ path: join(PASTA, `tarefas-${w}.png`) });
  if (w === 390) {
    await p.getByRole("button", { name: "Agenda", exact: true }).click();
    await p.waitForTimeout(300);
    await p.screenshot({ path: join(PASTA, `tarefas-agenda-${w}.png`) });
    await p.getByRole("button", { name: "Tarefas", exact: true }).click();
  }
  // Check: marca uma tarefa e fotografa no meio do estouro e depois de assentar.
  const caixa = p.locator('.caixa[aria-pressed="false"]').first();
  if (await caixa.count()) {
    const r = await caixa.boundingBox();
    const clip = { x: Math.max(0, r.x - 40), y: Math.max(0, r.y - 80), width: Math.min(w - Math.max(0, r.x - 40), 520), height: 170 };
    await caixa.click();
    await p.waitForTimeout(200);
    await p.screenshot({ path: join(PASTA, `check-estouro-${w}.png`), clip });
    await p.waitForTimeout(900);
    await p.screenshot({ path: join(PASTA, `check-marcado-${w}.png`), clip });
  }
  if (w === 1903) {
    await p.locator(".tarefas-botao", { hasText: "Sem data" }).click();
    await p.waitForTimeout(400);
    await p.screenshot({ path: join(PASTA, `tarefas-semdata-${w}.png`) });
  }
}
await navegador.close();
console.log(erros.length ? erros.join("\n") : "sem erros de console nem rolagem horizontal");
