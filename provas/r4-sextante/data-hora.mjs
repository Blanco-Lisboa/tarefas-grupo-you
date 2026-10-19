// Prova do item 76 (Sextante): na ficha, Começa e Termina abrem calendário + rodas de hora e minuto.
// Teclado (Tab, setas, Enter), rolagem da roda com a roda do mouse virtual, Selecionar, e a tarefa salva no calendário.
// Chrome headless (fora da tela), servidor em 3100. 1440 e 390.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

const PASTA = fileURLToPath(new URL("./", import.meta.url));
const erros = [];
const b = await chromium.launch();
const foto = async (p, nome) => {
  await p.evaluate(() => {
    document.getElementById("prova-iw")?.remove();
    const s = document.createElement("div");
    s.id = "prova-iw";
    s.popover = "manual";
    s.textContent = `innerWidth ${innerWidth}`;
    s.style.cssText = "inset:auto 6px 6px auto;margin:0;border:0;background:#000;color:#fff;font:700 13px monospace;padding:3px 8px;pointer-events:none";
    document.body.append(s);
    s.showPopover();
  });
  await p.screenshot({ path: join(PASTA, nome) });
};
const aberto = (p) => p.evaluate(() => !!document.querySelector(".campo-data-pop:popover-open"));
const escolhida = (p, rotulo) => p.locator(`.campo-data-pop:popover-open [role=spinbutton][aria-label="${rotulo}"]`).getAttribute("aria-valuetext");

for (const [w, h] of [[1440, 760], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date(2026, 9, 19, 15, 0));
  p.on("console", (m) => m.type() === "error" && !m.text().includes("WebSocket") && erros.push(`[${w}] console: ${m.text()}`));
  p.on("pageerror", (e) => erros.push(`[${w}] pageerror: ${e.message}`));
  await p.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.locator(".cal-nova").click();
  await p.locator(".ficha").waitFor();
  await p.locator(".ficha-titulo").fill(`Prova hora ${w}`);
  if (await p.locator('.ficha input[type="time"]').count()) erros.push(`[${w}] ainda há campo de hora nativo`);

  // Começa: escolhe o dia 22 com o mouse, hora e minuto pelo teclado, Enter seleciona
  const comeca = p.locator(".campo-data-botao").first();
  await comeca.click();
  await p.waitForTimeout(350);
  if ((await escolhida(p, "Hora")) !== "00" || (await escolhida(p, "Minuto")) !== "00") erros.push(`[${w}] hora inicial não é 00:00`);
  await p.locator('.campo-data-pop:popover-open [data-dia="2026-10-22"]').click();
  if (!(await aberto(p))) erros.push(`[${w}] escolher o dia fechou o painel (com hora não deve fechar)`);
  await p.locator('.campo-data-pop:popover-open [role=spinbutton][aria-label="Hora"]').focus();
  await p.keyboard.press("ArrowDown");
  await p.keyboard.press("ArrowDown");
  await p.keyboard.press("Tab");
  for (let i = 0; i < 6; i++) await p.keyboard.press("ArrowDown");
  await p.waitForTimeout(500);
  if ((await escolhida(p, "Hora")) !== "02" || (await escolhida(p, "Minuto")) !== "30") erros.push(`[${w}] teclado: ${await escolhida(p, "Hora")}:${await escolhida(p, "Minuto")}`);
  await foto(p, `${w}-data-hora-comeca.png`);
  await p.keyboard.press("Enter");
  await p.waitForTimeout(300);
  if (await aberto(p)) erros.push(`[${w}] Enter na roda não fechou`);
  if ((await comeca.innerText()) !== "22/10/2026 · 02:30") erros.push(`[${w}] Começa: ${await comeca.innerText()}`);

  // Termina: sem hora, abre em 00:00 (item 84); gira a roda da hora com a rodinha do mouse (3 linhas) e seleciona
  const termina = p.locator(".campo-data-botao").nth(1);
  if ((await termina.innerText()) !== "Sem fim") erros.push(`[${w}] Termina antes: ${await termina.innerText()}`);
  await termina.click();
  await p.waitForTimeout(350);
  if ((await escolhida(p, "Hora")) !== "00" || (await escolhida(p, "Minuto")) !== "00") erros.push(`[${w}] Termina não abriu em 00:00`);
  await p.locator('.campo-data-pop:popover-open [role=spinbutton][aria-label="Hora"]').hover();
  await p.mouse.wheel(0, 96);
  await p.waitForTimeout(900);
  if ((await escolhida(p, "Hora")) !== "03") erros.push(`[${w}] rolagem: hora ${await escolhida(p, "Hora")}`);
  const caixa = await p.locator(".campo-data-pop:popover-open").boundingBox();
  if (caixa.x < 8 || caixa.x + caixa.width > w - 8 || caixa.y < 0 || caixa.y + caixa.height > h) erros.push(`[${w}] painel do Termina sai da tela: ${JSON.stringify(caixa)}`);
  await foto(p, `${w}-data-hora-termina-rolou.png`);
  await p.locator(".campo-data-pop:popover-open").getByRole("button", { name: "Selecionar" }).click();
  await p.waitForTimeout(300);
  if ((await termina.innerText()) !== "22/10/2026 · 03:00") erros.push(`[${w}] Termina: ${await termina.innerText()}`);
  await foto(p, `${w}-data-hora-ficha.png`);

  // Salva e confere no calendário
  await p.getByRole("button", { name: "Salvar" }).click();
  await p.waitForTimeout(600);
  const salvo = await p.locator(".evento", { hasText: `Prova hora ${w}` }).first().getAttribute("title");
  if (!salvo?.includes("02:30 às 03:00")) erros.push(`[${w}] tarefa salva com: ${salvo}`);
  await ctx.close();
}

// prefers-reduced-motion: a roda pula sem girar (scrollTo com behavior auto) e o painel abre sem transição
const ctx = await b.newContext({ viewport: { width: 1440, height: 760 }, reducedMotion: "reduce" });
const p = await ctx.newPage();
await p.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
await p.locator(".cal-nova").click();
await p.locator(".campo-data-botao").first().click();
await p.waitForTimeout(300);
const roda = p.locator('.campo-data-pop:popover-open [role=spinbutton][aria-label="Hora"]');
await roda.focus();
await p.keyboard.press("PageDown");
const agora = await roda.getAttribute("aria-valuetext"); // sem animação, já está no lugar no mesmo instante
if (agora !== "05") erros.push(`reduced-motion: roda em ${agora}, esperado 05`);
await ctx.close();

await b.close();
console.log(erros.length ? erros.join("\n") : "sem erros");
