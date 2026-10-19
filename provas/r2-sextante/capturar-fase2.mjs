// Prova da Fase 2 (calendário: itens 39, 40, 41, 42 e 49). Servidor em 3100 ligado: node provas/r2-sextante/capturar-fase2.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

const ENDERECO = "http://localhost:3100/calendario";
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const TAMANHOS = [[1903, 900], [1440, 760], [390, 844]];
const erros = [];
const resultado = {};

const navegador = await chromium.launch({ headless: true });
const marcar = (p) => p.evaluate(() => {
  const s = document.createElement("div");
  s.textContent = `innerWidth ${innerWidth}`;
  s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px;pointer-events:none";
  document.body.append(s);
});
const foto = async (p, nome) => { await p.waitForTimeout(300); await marcar(p); await p.screenshot({ path: join(PASTA, `f2-${nome}.png`) }); };

for (const [w, h] of TAMANHOS) {
  const ctx = await navegador.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  p.on("console", (m) => m.type() === "error" && !m.text().includes("WebSocket") && erros.push(`[${w}] console: ${m.text()}`));
  p.on("pageerror", (e) => erros.push(`[${w}] pageerror: ${e.message}`));
  await p.goto(ENDERECO, { waitUntil: "networkidle" });
  await p.waitForSelector(".cal-barra");
  for (const v of ["Dia", "Semana", "Mês", "Ano"]) {
    await p.getByRole("group", { name: "Visão do calendário" }).getByRole("button", { name: v }).click();
    const larg = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (larg > 0) erros.push(`[${w}] ${v}: página rola na horizontal (${larg}px)`);
    if (w > 767) {
      const sobra = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      if (sobra > 0) erros.push(`[${w}] ${v}: página rola na vertical (${sobra}px); o calendário devia caber na tela`);
    }
    await foto(p, `${w}-${v.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()}`);
  }
  await p.getByRole("button", { name: "Semana", exact: true }).click();
  // Filtro Rede aberto, com Instagram escolhido.
  await p.locator(".cal-filtros .selecao-botao", { hasText: "Rede" }).click();
  await p.locator(".selecao-pop:popover-open .selecao-opcao", { hasText: "Instagram" }).click();
  await foto(p, `${w}-filtro-rede`);
  await p.keyboard.press("Escape");
  await p.getByRole("button", { name: /Limpar/ }).click();
  // Sem data aberto.
  await p.locator(".cal-semdata-botao").click();
  await foto(p, `${w}-sem-data`);
  await p.keyboard.press("Escape");
  await ctx.close();
}

// Arrastar: Sem data -> segunda 10h; depois da grade de volta para o botão Sem data.
const ctx = await navegador.newContext({ viewport: { width: 1903, height: 900 } });
const p = await ctx.newPage();
p.on("pageerror", (e) => erros.push(`[arrastar] pageerror: ${e.message}`));
await p.goto(ENDERECO, { waitUntil: "networkidle" });
await p.getByRole("button", { name: "Semana", exact: true }).click();
const antes = Number(await p.locator(".cal-semdata-botao .selecao-contador").textContent());
await p.locator(".cal-semdata-botao").click();
const titulo = (await p.locator(".cal-semdata .evento-titulo").first().textContent()).trim();
await p.locator(".cal-semdata .evento").first().dragTo(p.locator(".grade-coluna").nth(1), { targetPosition: { x: 40, y: 10 * 48 + 5 } });
await p.waitForTimeout(300);
resultado.titulo = titulo;
resultado.naGrade = await p.locator(".grade-coluna").nth(1).locator(".evento-bloco", { hasText: titulo }).count();
resultado.listaFechou = !(await p.locator(".cal-semdata-pop:popover-open").count());
resultado.contadorDepois = Number(await p.locator(".cal-semdata-botao .selecao-contador").textContent());
await foto(p, "arrastar-para-10h");
await p.locator(".evento-bloco", { hasText: titulo }).dragTo(p.locator(".cal-semdata-botao"));
await p.waitForTimeout(300);
resultado.voltouParaSemData = Number(await p.locator(".cal-semdata-botao .selecao-contador").textContent()) === antes;
// Atalho de teclado ainda funciona (M = mês).
await p.locator("h1").click();
await p.keyboard.press("m");
resultado.atalhoMes = await p.getByRole("button", { name: "Mês" }).getAttribute("aria-pressed");
await ctx.close();

// Prova de que o log captura (página à parte para não sujar as fotos).
const prova = await navegador.newPage();
prova.on("console", (m) => m.type() === "error" && erros.push(`[prova] console: ${m.text()}`));
await prova.goto(ENDERECO, { waitUntil: "networkidle" });
await prova.evaluate(() => console.error("ERRO DE PROPOSITO (prova de que o log captura)"));
await navegador.close();
console.log(JSON.stringify({ antes, ...resultado }, null, 1));
console.log(erros.length ? "ERROS:\n" + erros.join("\n") : "sem erros");
