// Prova dos achados 5 e 6 da revisão do Régua (Sextante, calendário). Achado 5: criar tarefa pelo teclado. Foca o botão
// escondido "+ Nova tarefa" do dia inteiro, da coluna de horário (9h) e da célula do mês, fotografa, aperta Enter e confere
// que a ficha abriu com o dia certo. 1440 e 390. Servidor em 3100 ligado. Chrome headless, nunca usa o mouse/teclado de verdade.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

const PASTA = fileURLToPath(new URL("./", import.meta.url));
const erros = [];
const b = await chromium.launch();
const marcar = (p) => p.evaluate(() => {
  const s = document.createElement("div");
  s.textContent = `innerWidth ${innerWidth}`;
  s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#000;color:#fff;font:700 13px monospace;padding:3px 8px;pointer-events:none";
  document.body.append(s);
});

for (const [w, h] of [[1440, 760], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erros.push(`[${w}] pageerror: ${e.message}`));
  await p.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
  await p.locator(".cal-painel").waitFor();
  await marcar(p);
  // Escondido: nenhum botão de criar aparece sem foco
  const visiveis = await p.locator(".cal-criar").evaluateAll((l) => l.filter((x) => x.getBoundingClientRect().width > 2).length);
  if (visiveis) erros.push(`[${w}] ${visiveis} botões de criar visíveis sem foco`);
  for (const [nome, seletor, visao] of [
    ["dia-inteiro", ".grade-topo[data-hoje] .cal-criar", null],
    ["horario", ".grade-coluna[data-hoje] .cal-criar", null],
    ["mes", ".mes-celula[data-hoje] .cal-criar", "m"],
  ]) {
    if (visao) { await p.keyboard.press(visao); await p.waitForTimeout(300); }
    // A faixa de dia inteiro não marca o hoje: pega a da mesma posição do cabeçalho de hoje
    const i = await p.locator(".grade-dia").evaluateAll((l) => l.findIndex((x) => x.dataset.hoje === "true"));
    const botao = nome === "dia-inteiro" ? p.locator(".grade-topo .cal-criar").nth(i) : p.locator(seletor.replace("[data-hoje]", '[data-hoje="true"]'));
    await botao.focus();
    await botao.scrollIntoViewIfNeeded();
    if (w === 390 && nome !== "mes") await p.locator(".grade-janela").evaluate((j) => (j.scrollLeft = 0));
    await p.screenshot({ path: join(PASTA, `${w}-foco-${nome}.png`) });
    const rotulo = await botao.getAttribute("aria-label");
    await p.keyboard.press("Enter");
    const ficha = p.locator("dialog[open]");
    await ficha.waitFor({ timeout: 3000 }).catch(() => erros.push(`[${w}] ${nome}: Enter não abriu a ficha (${rotulo})`));
    const data = await ficha.locator('input[type^="date"]').first().inputValue().catch(() => "?");
    console.log(`[${w}] ${nome}: "${rotulo}" -> ficha com data ${data}`);
    await p.keyboard.press("Escape");
    await ficha.waitFor({ state: "hidden", timeout: 3000 }).catch(() => erros.push(`[${w}] ${nome}: ficha não fechou`));
  }
  await ctx.close();
}
await b.close();
console.log(erros.length ? erros.join("\n") : "sem erros");
