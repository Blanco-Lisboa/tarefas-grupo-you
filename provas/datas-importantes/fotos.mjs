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
    const etiquetas = await p.locator(".data-imp").evaluateAll((els) => els.map((e) => `${e.querySelector(".data-imp-nome").textContent}${e.querySelector(".data-imp-mais")?.textContent ?? ""} [${[...e.querySelectorAll(".balao-item")].map((i) => i.textContent).join(" | ")}]`));
    const aneis = await p.locator(".ano-dias .ano-dia[data-data]").count();
    console.log(modo, rotulo, v === "ano" ? `anéis: ${aneis}` : `etiquetas: ${etiquetas.join(" ; ") || "nenhuma"}`);
    for (const [w, h] of TAMANHOS) {
      await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(600);
      await foto(`${modo.toLowerCase()}-${v}-${w}`);
    }
    await p.setViewportSize({ width: 1440, height: 760 }); await p.waitForTimeout(300);
    if (v === "dia") await p.locator(".cal-navegar button", { hasText: "Hoje" }).click().then(() => p.waitForTimeout(400));
  }
  await visao("Semana");
}
// Balão de vidro: mouse no Ano (12/10 e 25/12) e na etiqueta do Mês; foco do teclado abre também
await p.setViewportSize({ width: 1440, height: 760 });
await p.locator(".ptroca button", { hasText: "Tarefas" }).click(); await p.waitForTimeout(800);
await visao("Ano");
const aberto = () => p.locator(".balao:popover-open").evaluateAll((els) => els.map((e) => e.innerText.replace(/\n/g, " | ")));
await p.locator(".ano-mes").nth(9).locator("button.ano-dia").nth(12 - 1).hover(); await p.waitForTimeout(300);
console.log("balão Ano 12/10:", await aberto()); await foto("balao-ano-1440");
await p.locator(".ano-mes").nth(11).locator("button.ano-dia").nth(25 - 1).hover(); await p.waitForTimeout(300);
console.log("balão Ano 25/12:", await aberto());
await p.mouse.move(5, 5);
await p.locator(".ano-mes").nth(10).locator("button.ano-dia").nth(20 - 1).focus(); await p.waitForTimeout(300);
console.log("balão no foco 20/11:", await aberto(), "| describedby:", await p.evaluate(() => document.getElementById(document.activeElement.getAttribute("aria-describedby"))?.textContent));
await foto("balao-ano-foco-1440");
// borda direita: 31/12 na última coluna
await p.locator(".ano-mes").nth(11).locator("button.ano-dia").nth(31 - 1).hover(); await p.waitForTimeout(300);
const caixa = await p.locator(".balao:popover-open").boundingBox();
console.log("balão 31/12 dentro da tela:", caixa && caixa.x >= 0 && caixa.x + caixa.width <= 1440 && caixa.y >= 0, caixa);
await foto("balao-ano-borda-1440");
await visao("Mês");
await p.locator(".data-imp").nth(2).hover(); await p.waitForTimeout(300);
console.log("balão Mês:", await aberto()); await foto("balao-mes-1440");
await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
await visao("Ano");
await p.locator(".ano-mes").nth(0).locator("button.ano-dia").nth(1 - 1).hover(); await p.waitForTimeout(300);
const c390 = await p.locator(".balao:popover-open").boundingBox();
console.log("balão 390 dentro da tela:", c390 && c390.x >= 0 && c390.x + c390.width <= 390, c390); await foto("balao-ano-390");
console.log("erros:", erros.length ? erros : "nenhum");
await nav.close();
