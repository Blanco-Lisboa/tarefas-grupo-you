// Prova das datas importantes (feriado e comemorativa) nos 2 calendários, 4 visões. Cópia de exemplo (3101, banco falso).
// Hoje no exemplo = 27/10/2026: a semana tem o Dia do Servidor (28/10); o Dia anda um passo para cair no 28.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.PW_DIR ?? join(process.env.APPDATA, "npm"), "node_modules", "/"));
const { chromium } = require(process.env.PW_DIR ? "playwright-core" : "playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const marca = () => { const d = document.createElement("div"); d.id = "iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); };
const TAMANHOS = [[1903, 900], [1440, 760], [390, 844]];
const VISOES = [["dia", "Dia"], ["semana", "Semana"], ["mes", "Mês"], ["ano", "Ano"]];
const nav = await chromium.launch({ channel: process.env.PW_DIR ? "chrome" : undefined, args: ["--window-position=-32000,0"] });
const ctx = await nav.newContext({ viewport: { width: 1440, height: 760 } });
const p = await ctx.newPage();
const erros = [];
p.on("pageerror", (e) => erros.push(e.message));
p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
await p.goto("http://127.0.0.1:3201/entrar", { waitUntil: "load" });
await p.goto("http://127.0.0.1:3101/calendario", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
const visao = async (rotulo) => {
  await p.locator(".cal-acoes .selecao-botao").filter({ has: p.locator(".selecao-rotulo-p", { hasText: "Visão" }) }).click();
  await p.locator('.selecao-lista[aria-label="Visão"] .selecao-opcao', { hasText: rotulo }).first().click();
  await p.keyboard.press("Escape"); await p.waitForTimeout(500);
};
const foto = async (n) => { await p.evaluate(() => document.getElementById("iw")?.remove()); await p.evaluate(marca); await p.screenshot({ path: `${PASTA}${n}.png` }); };
const seta = (nome) => p.locator(`.cal-navegar button[aria-label="${nome}"]`).click().then(() => p.waitForTimeout(500));

for (const modo of ["Tarefas", "Postagens"]) {
  await p.setViewportSize({ width: 1440, height: 760 });
  await p.locator(".ptroca button", { hasText: modo }).click(); await p.waitForTimeout(1000);
  for (const [v, rotulo] of VISOES) {
    await visao(rotulo);
    if (v === "dia") await seta("Próximo");
    const etiquetas = await p.locator(".data-imp").evaluateAll((els) => els.map((e) => `${e.textContent} [${e.getAttribute("title")?.replace(/\n/g, " | ")}]`));
    const aneis = await p.locator(".ano-dias .ano-dia[data-data]").count();
    console.log(modo, rotulo, v === "ano" ? `anéis: ${aneis}` : `etiquetas: ${etiquetas.join(" ; ") || "nenhuma"}`);
    for (const [w, h] of TAMANHOS) {
      await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(600);
      await foto(`${modo.toLowerCase()}-${v}-${w}`);
    }
    await p.setViewportSize({ width: 1440, height: 760 }); await p.waitForTimeout(300);
    if (v === "dia") await p.locator(".cal-navegar button", { hasText: "Hoje" }).click().then(() => p.waitForTimeout(400));
  }
  // Ano: title de um feriado (12/10) e do hoje
  console.log(modo, "title 12/10:", await p.locator(".ano-dia[title^='12 de outubro']").getAttribute("title"));
  await visao("Semana");
}
console.log("erros:", erros.length ? erros : "nenhum");
await nav.close();
