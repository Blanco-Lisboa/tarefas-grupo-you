// Prova da folha que vira: node provas/r2-pena/virar.mjs (servidor em 3100)
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const erros = [];
const nav = await chromium.launch({ headless: true });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await (await nav.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on("console", (m) => m.type() === "error" && !m.text().includes("WebSocket") && erros.push(`[${w}] ${m.text()}`));
  p.on("pageerror", (e) => erros.push(`[${w}] pageerror: ${e.message}`));
  await p.goto("http://localhost:3100/tarefas", { waitUntil: "networkidle" });
  await p.locator(".tarefas-data").fill("2026-10-21");
  await p.waitForTimeout(1500);
  const marca = () => p.evaluate(() => { const s = document.createElement("div"); s.id = "iw"; s.textContent = `innerWidth ${innerWidth}`; s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px"; document.body.append(s); });
  await marca();
  for (const [nome, botao, espera] of [["proximo", "Próximo", 300], ["anterior", "Anterior", 300]]) {
    await p.getByRole("button", { name: botao === "Próximo" ? "Próximo dia" : "Dia anterior" }).click();
    await p.waitForTimeout(espera);
    await p.screenshot({ path: join(PASTA, `virando-${nome}-${w}.png`) });
    await p.waitForTimeout(1500);
  }
  const dia = await p.locator(".tarefas-data").inputValue();
  const sobrou = await p.locator(".fv-camada").count();
  console.log(w, "dia final", dia, "camadas sobrando", sobrou);
  // fluidez: intervalos entre quadros durante uma virada
  const q = await p.evaluate(() => new Promise((ok) => { const t = []; const f = (n) => { t.push(n); if (t.length < 50) requestAnimationFrame(f); else ok(t); }; document.querySelector('[aria-label="Próximo dia"]').click(); requestAnimationFrame(f); }));
  const d = q.slice(1).map((v, i) => v - q[i]);
  console.log(w, "quadros:", d.length, "maior intervalo", Math.max(...d).toFixed(0), "ms, média", (d.reduce((a, b) => a + b) / d.length).toFixed(1), "ms");
}
await nav.close();
console.log(erros.length ? erros.join("\n") : "sem erros de console");
