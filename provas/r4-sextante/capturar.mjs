// Prova da rodada 4 (Sextante): item 66 (menu mais estreito) e item 64 (CampoData no lugar do campo de data nativo).
// Servidor em 3100 ligado. Chrome headless (fora da tela), nunca usa o mouse/teclado de verdade.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

const PASTA = fileURLToPath(new URL("./", import.meta.url));
const erros = [];
const notas = [];
const b = await chromium.launch();
const marcar = (p) => p.evaluate(() => {
  document.getElementById("prova-iw")?.remove();
  const s = document.createElement("div");
  s.id = "prova-iw";
  s.popover = "manual"; // top layer: fica por cima até da ficha (dialog)
  s.textContent = `innerWidth ${innerWidth}`;
  s.style.cssText = "inset:auto 6px 6px auto;margin:0;border:0;background:#000;color:#fff;font:700 13px monospace;padding:3px 8px;pointer-events:none";
  document.body.append(s);
  s.showPopover();
});
const foto = async (p, nome) => { await marcar(p); await p.screenshot({ path: join(PASTA, nome) }); };
const centros = (p) => p.evaluate(() => [...document.querySelectorAll(".menu .menu-icone, .menu .menu-inicial, .menu .bolinha-n")].filter((e) => e.offsetParent).map((e) => {
  const r = e.getBoundingClientRect();
  return Math.round(r.left + r.width / 2);
}));
const textoBotao = (p, i) => p.locator(".campo-data-botao").nth(i).innerText();
const aberto = (p) => p.evaluate(() => !!document.querySelector(".campo-data-pop:popover-open"));
const focado = (p) => p.evaluate(() => document.activeElement?.getAttribute("data-dia"));

for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date(2026, 9, 19, 15, 0));
  p.on("console", (m) => m.type() === "error" && !m.text().includes("WebSocket") && erros.push(`[${w}] console: ${m.text()}`));
  p.on("pageerror", (e) => erros.push(`[${w}] pageerror: ${e.message}`));
  await p.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  const larg = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (larg > 0) erros.push(`[${w}] página rola na horizontal (${larg}px)`);

  // Item 66: largura do menu e coluna dos ícones, aberto e recolhido
  const menuW = await p.evaluate(() => document.querySelector(".menu").getBoundingClientRect().width);
  const c = [...new Set(await centros(p))];
  notas.push(`[${w}] menu ${menuW}px, centros dos ícones ${c.join(",")}`);
  if (c.length !== 1) erros.push(`[${w}] ícones fora da mesma coluna: ${c}`);
  await foto(p, `${w}-menu.png`);
  if (w !== 390) {
    await p.locator(".menu-alterna").click();
    await p.waitForTimeout(400);
    const r = [...new Set(await centros(p))];
    notas.push(`[${w}] recolhido ${await p.evaluate(() => document.querySelector(".menu").getBoundingClientRect().width)}px, centros ${r.join(",")}`);
    if (w === 1440) await foto(p, "1440-menu-recolhido.png");
    await p.locator(".menu-alterna").click();
    await p.waitForTimeout(400);
  }
  if (w === 1903) { await ctx.close(); continue; }

  // Item 64: abre a ficha, abre o calendário do campo "Data"
  await p.locator(".cal-nova").click();
  await p.locator(".ficha").waitFor();
  await foto(p, `${w}-ficha-data-fechado.png`);
  await p.locator(".campo-data-botao").first().click();
  await p.waitForTimeout(350);
  if (!(await aberto(p))) erros.push(`[${w}] painel não abriu`);
  if ((await focado(p)) !== "2026-10-19") erros.push(`[${w}] foco ao abrir em ${await focado(p)} (esperado hoje)`);
  await p.locator('[data-dia="2026-10-22"]').hover();
  await foto(p, `${w}-data-aberto-hoje.png`);

  // Teclado: direita + baixo = 27/10, Enter escolhe e fecha
  await p.keyboard.press("ArrowRight");
  await p.keyboard.press("ArrowDown");
  if ((await focado(p)) !== "2026-10-27") erros.push(`[${w}] setas foram para ${await focado(p)}`);
  await p.keyboard.press("Enter");
  await p.waitForTimeout(300);
  if (await aberto(p)) erros.push(`[${w}] Enter não fechou`);
  if ((await textoBotao(p, 0)) !== "27/10/2026") erros.push(`[${w}] valor depois do Enter: ${await textoBotao(p, 0)}`);
  const foco = await p.evaluate(() => document.activeElement?.classList.contains("campo-data-botao"));
  if (!foco) erros.push(`[${w}] foco não voltou ao botão depois de escolher`);

  // PageDown vira o mês; Esc fecha sem mudar
  await p.keyboard.press("Enter");
  await p.waitForTimeout(300);
  await p.keyboard.press("PageDown");
  const mes = await p.locator(".campo-data-pop:popover-open .campo-data-mes").innerText();
  if (mes !== "Novembro 2026" || (await focado(p)) !== "2026-11-27") erros.push(`[${w}] PageDown: ${mes} ${await focado(p)}`);
  await foto(p, `${w}-data-teclado-pagedown.png`);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  if (await aberto(p)) erros.push(`[${w}] Esc não fechou`);
  if (!(await p.locator(".ficha").evaluate((d) => d.open))) erros.push(`[${w}] Esc fechou a ficha junto`);
  if ((await textoBotao(p, 0)) !== "27/10/2026") erros.push(`[${w}] Esc mudou o valor`);

  // "Termina no dia": dias antes do início ficam apagados e não escolhem
  const ultimo = p.locator(".campo-data-botao").last();
  await ultimo.click();
  await p.waitForTimeout(350);
  await p.locator('.campo-data-pop:popover-open [data-dia="2026-10-20"]').click({ force: true });
  await foto(p, `${w}-data-termina-min.png`);
  if (!(await aberto(p))) erros.push(`[${w}] dia antes do mínimo fechou o painel`);
  await p.locator('.campo-data-pop:popover-open [data-dia="2026-10-29"]').click();
  await p.waitForTimeout(300);
  if ((await ultimo.innerText()) !== "29/10/2026") erros.push(`[${w}] termina no dia: ${await ultimo.innerText()}`);

  // Clique fora fecha; Limpar volta para "Sem data"
  await p.locator(".campo-data-botao").first().click();
  await p.waitForTimeout(300);
  await p.locator(".ficha-faixa").click({ position: { x: 10, y: 10 } });
  await p.waitForTimeout(300);
  if (await aberto(p)) erros.push(`[${w}] clique fora não fechou`);
  await p.locator(".campo-data-botao").first().click();
  await p.waitForTimeout(300);
  await p.locator(".campo-data-pop:popover-open .campo-data-limpar").click();
  await p.waitForTimeout(300);
  if ((await textoBotao(p, 0)) !== "Sem data") erros.push(`[${w}] Limpar: ${await textoBotao(p, 0)}`);
  await ctx.close();
}

// prefers-reduced-motion: o painel abre sem transição
const ctx = await b.newContext({ viewport: { width: 1440, height: 760 }, reducedMotion: "reduce" });
const p = await ctx.newPage();
await p.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
await p.locator(".cal-nova").click();
await p.locator(".campo-data-botao").first().click();
const tr = await p.evaluate(() => getComputedStyle(document.querySelector(".campo-data-pop")).transitionDuration);
if (!/^0s(, 0s)*$/.test(tr)) erros.push(`reduced-motion: transição ${tr}`);
await ctx.close();

await b.close();
console.log(notas.join("\n"));
console.log(erros.length ? erros.join("\n") : "sem erros");
