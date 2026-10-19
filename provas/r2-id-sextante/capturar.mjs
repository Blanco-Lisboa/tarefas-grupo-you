// Prova do pente fino da ID (item 53), território do Sextante: base, casca/menu, botão de seleção e calendário.
// 1) fotos das telas em 1903, 1440 e 390; 2) recortes das peças; 3) cada recorte AO LADO da peça da prancha (lado-*.png).
// Antes: node provas/r2-id-sextante/fotos-id.mjs (fotos da ID). Servidor em 3100 ligado.
import { createRequire } from "node:module";
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

const BASE = "http://localhost:3100";
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const erros = [];
const b = await chromium.launch();
const marcar = (p) => p.evaluate(() => {
  const s = document.createElement("div");
  s.textContent = `innerWidth ${innerWidth}`;
  s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px;pointer-events:none";
  document.body.append(s);
});
const caixa = async (p, ...sels) => {
  const bs = (await Promise.all(sels.map((s) => p.locator(s).first().boundingBox()))).filter(Boolean);
  const x = Math.max(Math.min(...bs.map((r) => r.x)) - 16, 0), y = Math.max(Math.min(...bs.map((r) => r.y)) - 16, 0);
  return { x, y, width: Math.max(...bs.map((r) => r.x + r.width)) + 16 - x, height: Math.max(...bs.map((r) => r.y + r.height)) + 16 - y };
};

for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  p.on("console", (m) => m.type() === "error" && !m.text().includes("WebSocket") && erros.push(`[${w}] console: ${m.text()}`));
  p.on("pageerror", (e) => erros.push(`[${w}] pageerror: ${e.message}`));
  await p.goto(`${BASE}/calendario`, { waitUntil: "networkidle" });
  const larg = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (larg > 0) erros.push(`[${w}] página rola na horizontal (${larg}px)`);
  await marcar(p);
  await p.screenshot({ path: join(PASTA, `tela-${w}-semana.png`) });
  if (w === 1903) {
    await p.locator(".cal-barra").screenshot({ path: join(PASTA, "meu-botoes.png") });
    await p.screenshot({ path: join(PASTA, "meu-campos.png"), clip: await caixa(p, ".casca-barra", ".cal-filtros") });
    await p.screenshot({ path: join(PASTA, "meu-hoje.png"), clip: await caixa(p, ".grade-dia[data-hoje=true]") });
  }
  // Filtro aberto com uma escolha (botão de seleção + lista em vidro roxo).
  await p.locator(".cal-filtros .selecao-botao", { hasText: "Pessoa" }).click();
  await p.locator(".selecao-pop:popover-open .selecao-opcao").nth(1).click();
  await p.waitForTimeout(350);
  if (w === 1903) await p.screenshot({ path: join(PASTA, "meu-submenu.png"), clip: await caixa(p, ".cal-filtros .selecao-botao", ".selecao-pop:popover-open") });
  await marcar(p);
  await p.screenshot({ path: join(PASTA, `tela-${w}-filtro.png`) });
  await p.keyboard.press("Escape");
  await p.locator(".cal-limpar").click();
  // Visão: mês (botão de seleção de escolha única).
  await p.locator(".cal-acoes .selecao-botao", { hasText: "Visão" }).click();
  await p.locator(".selecao-pop:popover-open .selecao-opcao", { hasText: "Mês" }).click();
  await p.waitForTimeout(300);
  await marcar(p);
  await p.screenshot({ path: join(PASTA, `tela-${w}-mes.png`) });
  // Sem data aberto.
  await p.locator(".cal-semdata-botao").click();
  await p.waitForTimeout(350);
  if (w === 1903) await p.screenshot({ path: join(PASTA, "meu-semdata.png"), clip: await caixa(p, ".cal-semdata-botao", ".cal-semdata-pop:popover-open") });
  await marcar(p);
  await p.screenshot({ path: join(PASTA, `tela-${w}-sem-data.png`) });
  await p.keyboard.press("Escape");
  if (w === 1903) {
    await p.locator(".menu").screenshot({ path: join(PASTA, "meu-menu.png") });
    await p.getByRole("button", { name: "Recolher menu" }).focus();
    await p.keyboard.press("Enter");
    await p.waitForTimeout(350);
    await p.locator(".menu").screenshot({ path: join(PASTA, "meu-menu-recolhido.png") });
    await p.getByRole("button", { name: "Expandir menu" }).focus();
    await p.keyboard.press("Enter");
  }
  await ctx.close();
}

// Lado a lado (um em cima do outro, tamanho real): peça da ID (prancha) e a mesma peça no sistema.
const PARES = [
  ["botoes", "id-botoes.png", "meu-botoes.png", "Botões: placa a 22°, texto reto em caixa alta (prancha seção 10)"],
  ["campos", "id-campos.png", "meu-campos.png", "Campo de seleção: reto, borda 1,5px tinta 2, seta da ID"],
  ["submenu", "id-submenu.png", "meu-submenu.png", "Lista que abre = submenu do site: vidro roxo com orelhas, texto bege"],
  ["sem-data", "id-submenu.png", "meu-semdata.png", "Sem data: mesma lista em vidro roxo"],
  ["menu", "id-menus.png", "meu-menu.png", "Menu: ativo em ouro e negrito, botão de menu = 3 barras"],
  ["selo-hoje", "id-selos.png", "meu-hoje.png", "Hoje = selo da ID (placa roxa a 22°, número reto)"],
];
const lado = await b.newPage({ viewport: { width: 1903, height: 900 } });
for (const [nome, id, meu, legenda] of PARES) {
  const u = (f) => pathToFileURL(join(PASTA, f)).href;
  const html = join(PASTA, "_lado.html");
  writeFileSync(html, `<meta charset="utf-8"><body style="margin:0;padding:24px;background:#F6F2EA;font:600 15px system-ui;color:#1A1024">
    <p style="margin:0 0 16px">${legenda}</p>
    <div style="display:flex;flex-direction:column;gap:24px;align-items:flex-start">
      <figure style="margin:0"><figcaption style="margin-bottom:8px">ID da Beec (prancha)</figcaption><img src="${u(id)}" style="max-width:100%;border:1px solid #0002"></figure>
      <figure style="margin:0"><figcaption style="margin-bottom:8px">Sistema</figcaption><img src="${u(meu)}" style="max-width:100%;border:1px solid #0002"></figure>
    </div></body>`);
  await lado.goto(pathToFileURL(html).href, { waitUntil: "load" });
  await lado.screenshot({ path: join(PASTA, `lado-${nome}.png`), fullPage: true });
}
rmSync(join(PASTA, "_lado.html"), { force: true });

// Nada quebrou no comportamento: arrastar da lista Sem data para segunda 10h e de volta para o botão; atalho M = mês.
const pa = await b.newPage({ viewport: { width: 1903, height: 900 } });
pa.on("pageerror", (e) => erros.push(`[arrastar] pageerror: ${e.message}`));
await pa.goto(`${BASE}/calendario`, { waitUntil: "networkidle" });
const contar = async () => Number(await pa.locator(".cal-semdata-botao .selecao-contador").textContent());
const antes = await contar();
await pa.locator(".cal-semdata-botao").click();
const titulo = (await pa.locator(".cal-semdata .evento-titulo").first().textContent()).trim();
await pa.locator(".cal-semdata .evento").first().dragTo(pa.locator(".grade-coluna").nth(1), { targetPosition: { x: 40, y: 10 * 48 + 5 } });
await pa.waitForTimeout(300);
const naGrade = await pa.locator(".grade-coluna").nth(1).locator(".evento-bloco", { hasText: titulo }).count();
const depois = await contar();
await pa.locator(".evento-bloco", { hasText: titulo }).dragTo(pa.locator(".cal-semdata-botao"));
await pa.waitForTimeout(300);
const voltou = await contar();
await pa.locator("h1").click();
await pa.keyboard.press("m");
const mes = await pa.locator(".cal-acoes .selecao-escolha").textContent();
console.log(JSON.stringify({ antes, naGrade, depois, voltou, mes }));
if (!(naGrade === 1 && depois === antes - 1 && voltou === antes && mes === "Mês")) erros.push("arrastar ou atalho falhou");
const prova = await b.newPage();
prova.on("console", (m) => m.type() === "error" && erros.push(`[prova] console: ${m.text()}`));
await prova.goto(`${BASE}/calendario`, { waitUntil: "networkidle" });
await prova.evaluate(() => console.error("ERRO DE PROPOSITO (prova de que o log captura)"));
await b.close();
console.log(erros.length ? "ERROS:\n" + erros.join("\n") : "sem erros");
