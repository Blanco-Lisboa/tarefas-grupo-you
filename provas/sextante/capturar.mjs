// Prova do Sextante: capturas das 4 visões + ficha + arrastar, em 3 larguras, com erros do console.
// Rodar (servidor em 3100 já ligado): node provas/sextante/capturar.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

// localhost e não 127.0.0.1: o next dev bloqueia o JavaScript para 127.0.0.1 (allowedDevOrigins) e a página não hidrata.
const ENDERECO = "http://localhost:3100/calendario";
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const TAMANHOS = [[1903, 900], [1440, 760], [390, 844]];
const erros = [];

const navegador = await chromium.launch({ headless: true });
const marcar = (p) => p.evaluate(() => {
  const s = document.createElement("div");
  s.textContent = `innerWidth ${innerWidth}`;
  s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px;pointer-events:none";
  document.body.append(s);
});

for (const [w, h] of TAMANHOS) {
  const pagina = await navegador.newPage({ viewport: { width: w, height: h } });
  pagina.on("console", (m) => m.type() === "error" && !m.text().includes("WebSocket") && erros.push(`[${w}] console: ${m.text()}`));
  pagina.on("pageerror", (e) => erros.push(`[${w}] pageerror: ${e.message}`));
  await pagina.goto(ENDERECO, { waitUntil: "networkidle" });
  await pagina.waitForSelector(".cal-barra");
  if (w === 1903) await pagina.evaluate(() => console.error("ERRO DE PROPOSITO (prova de que o log captura)"));
  for (const v of ["Dia", "Semana", "Mês", "Ano"]) {
    await pagina.getByRole("group", { name: "Visão do calendário" }).getByRole("button", { name: v }).click();
    await pagina.waitForTimeout(250);
    const larg = await pagina.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (larg > 0) erros.push(`[${w}] ${v}: página rola na horizontal (${larg}px)`);
    await marcar(pagina);
    await pagina.screenshot({ path: join(PASTA, `${w}-${v.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()}.png`) });
  }
  // Ficha aberta por clique numa tarefa (visão semana).
  await pagina.getByRole("button", { name: "Semana", exact: true }).click();
  await pagina.locator(".evento-bloco").first().click();
  await pagina.waitForSelector("dialog.ficha[open]");
  await marcar(pagina);
  await pagina.screenshot({ path: join(PASTA, `${w}-ficha.png`) });
  await pagina.keyboard.press("Escape");
  // Dia com tarefas: clicar no cabeçalho de quinta (22/10) leva à visão Dia.
  await pagina.locator(".grade-dia").nth(4).click();
  await pagina.waitForTimeout(250);
  await marcar(pagina);
  await pagina.screenshot({ path: join(PASTA, `${w}-dia-22.png`) });
  await pagina.close();
}

// Arrastar: tarefa Sem data -> segunda 10h; depois para o topo (dia inteiro); depois de volta para Sem data.
const p = await navegador.newPage({ viewport: { width: 1903, height: 900 } });
p.on("pageerror", (e) => erros.push(`[arrastar] pageerror: ${e.message}`));
await p.goto(ENDERECO, { waitUntil: "networkidle" });
await p.getByRole("button", { name: "Semana", exact: true }).click();
const titulo = (await p.locator(".cal-semdata .evento-titulo").first().textContent()).trim();
const coluna = p.locator(".grade-coluna").nth(1);
await p.locator(".cal-semdata .evento").first().dragTo(coluna, { targetPosition: { x: 40, y: 10 * 48 + 5 } });
const naGrade = await p.locator(".grade-coluna").nth(1).locator(".evento-bloco", { hasText: titulo }).count();
const hora = naGrade ? await p.locator(".grade-coluna").nth(1).locator(".evento-bloco", { hasText: titulo }).getAttribute("title") : "";
await marcar(p);
await p.screenshot({ path: join(PASTA, "arrastar-1-para-10h.png") });
await p.locator(".evento-bloco", { hasText: titulo }).dragTo(p.locator(".grade-topo").nth(3));
const noTopo = await p.locator(".grade-topo").nth(3).locator(".evento", { hasText: titulo }).count();
await p.locator(".grade-topo .evento", { hasText: titulo }).dragTo(p.locator(".cal-semdata"));
const voltou = await p.locator(".cal-semdata .evento", { hasText: titulo }).count();
// Clique num horário vazio cria tarefa às 20h.
await p.locator(".grade-coluna").nth(4).click({ position: { x: 20, y: 20 * 48 + 10 } });
const nova = await p.locator("dialog.ficha[open] .ficha-rotulo").textContent();
const horaNova = await p.locator('dialog.ficha[open] input[type="time"]').first().inputValue();
await p.locator("dialog.ficha .ficha-titulo").fill("Teste do Sextante");
await p.getByRole("button", { name: "Salvar" }).click();
const criada = await p.locator(".grade-coluna").nth(4).locator(".evento-bloco", { hasText: "Teste do Sextante" }).count();
await p.close();
await navegador.close();

console.log(JSON.stringify({ titulo, naGrade, hora, noTopo, voltou, nova, horaNova, criada }, null, 1));
console.log(erros.length ? "ERROS:\n" + erros.join("\n") : "sem erros");
