// Prova do item 84 (Sextante): a roda de hora gira ARRASTANDO, com o mouse (1440) e com o dedo (390, toque de verdade pelo
// protocolo do Chrome), é circular (23 -> 00, 00 -> 55) e abre em 00:00 sem hora escolhida. Sequência de fotos de um
// arraste real (antes, no meio com o botão/dedo ainda apertado, depois) e o valor salvo na ficha, reaberta do calendário.
// Chrome headless (fora da tela), servidor em 3100. Nunca usa o mouse/teclado de verdade do Natham.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

const PASTA = fileURLToPath(new URL("./", import.meta.url));
const erros = [];
const b = await chromium.launch();
const pop = ".campo-data-pop:popover-open";
const valor = (p, r) => p.locator(`${pop} [role=spinbutton][aria-label="${r}"]`).getAttribute("aria-valuetext");

for (const [w, h, toque] of [[1440, 760, false], [390, 844, true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: toque });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await p.clock.setFixedTime(new Date(2026, 9, 19, 15, 0));
  p.on("pageerror", (e) => erros.push(`[${w}] pageerror: ${e.message}`));
  const foto = async (nome) => {
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
    await p.screenshot({ path: join(PASTA, `${w}-roda-${nome}.png`) });
  };
  // Arraste real: aperta, move em passos, (fica parado e fotografa), solta. Mouse no 1440, dedo no 390.
  const centro = async (r) => {
    const c = await p.locator(`${pop} [role=spinbutton][aria-label="${r}"]`).boundingBox();
    return [c.x + c.width / 2, c.y + c.height / 2];
  };
  const apertar = (x, y) => toque ? cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }) : (p.mouse.move(x, y), p.mouse.down());
  const mover = (x, y) => toque ? cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] }) : p.mouse.move(x, y);
  const soltar = () => toque ? cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }) : p.mouse.up();
  async function arrastar(r, dy, { meio, pausa = 150, passos = 8 } = {}) {
    const [x, y] = await centro(r);
    await apertar(x, y);
    for (let i = 1; i <= passos; i++) { await mover(x, y + (dy * i) / passos); await p.waitForTimeout(16); }
    await p.waitForTimeout(pausa);
    if (meio) await foto(meio);
    await soltar();
    await p.waitForTimeout(700);
  }

  await p.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.locator(".cal-nova").click();
  await p.locator(".ficha").waitFor();
  await p.locator(".ficha-titulo").fill(`Roda ${w}`);
  await p.locator(".campo-data-botao").first().click();
  await p.waitForTimeout(400);
  if ((await valor(p, "Hora")) !== "00" || (await valor(p, "Minuto")) !== "00") erros.push(`[${w}] não abriu em 00:00`);
  await p.locator(`${pop} [data-dia="2026-10-22"]`).click();
  await foto("1-antes");

  // Hora: arrasta 4 linhas para cima, segura parado no meio (foto), solta: 04
  await arrastar("Hora", -4.4 * 32, { meio: "2-meio-arrastando" }); // 4,4 linhas: a foto do meio mostra a roda entre duas linhas
  if ((await valor(p, "Hora")) !== "04") erros.push(`[${w}] arraste de 4 linhas: ${await valor(p, "Hora")}`);
  // Circular: arrasta 6 linhas para baixo a partir de 04 -> 22 (passa pelo 00 e volta para o 23)
  await arrastar("Hora", 6 * 32);
  if ((await valor(p, "Hora")) !== "22") erros.push(`[${w}] circular para trás: ${await valor(p, "Hora")}`);
  // Minuto: arrasta 3 linhas para baixo a partir de 00 -> 45 (00 -> 55 -> 50 -> 45)
  await arrastar("Minuto", 3 * 32);
  if ((await valor(p, "Minuto")) !== "45") erros.push(`[${w}] minuto circular: ${await valor(p, "Minuto")}`);
  // Inércia: arraste rápido de 2 linhas, soltando ainda em movimento, anda mais que 2
  const antes = Number(await valor(p, "Hora"));
  await arrastar("Hora", -2 * 32, { pausa: 0, passos: 3 });
  const depois = Number(await valor(p, "Hora"));
  const andou = (depois - antes + 24) % 24;
  if (andou <= 2) erros.push(`[${w}] sem inércia: andou ${andou}`);
  // Volta para 23 pelo teclado (circular também) e confere a passagem 23 -> 00 -> 23
  const roda = p.locator(`${pop} [role=spinbutton][aria-label="Hora"]`);
  await roda.focus();
  for (let i = 0; i < andou + 1; i++) await p.keyboard.press("ArrowUp"); // de 22+andou volta para 21... ajusta abaixo
  await p.waitForTimeout(600);
  while ((await valor(p, "Hora")) !== "23") { await p.keyboard.press("ArrowDown"); await p.waitForTimeout(500); }
  await p.keyboard.press("ArrowDown");
  await p.waitForTimeout(500);
  if ((await valor(p, "Hora")) !== "00") erros.push(`[${w}] teclado 23 -> ${await valor(p, "Hora")}`);
  await p.keyboard.press("ArrowUp");
  await p.waitForTimeout(500);
  await foto("3-depois");
  if ((await valor(p, "Hora")) !== "23" || (await valor(p, "Minuto")) !== "45") erros.push(`[${w}] antes de selecionar: ${await valor(p, "Hora")}:${await valor(p, "Minuto")}`);

  await p.locator(pop).getByRole("button", { name: "Selecionar" }).click();
  await p.waitForTimeout(300);
  const comeca = await p.locator(".campo-data-botao").first().innerText();
  if (comeca !== "22/10/2026 · 23:45") erros.push(`[${w}] Começa: ${comeca}`);
  await p.getByRole("button", { name: "Salvar" }).click();
  await p.waitForTimeout(500);
  // Reabre a tarefa do calendário: a ficha mostra o valor salvo
  await p.locator(".evento", { hasText: `Roda ${w}` }).first().click({ force: true });
  await p.locator(".ficha").waitFor();
  await p.waitForTimeout(300);
  const salvo = await p.locator(".campo-data-botao").first().innerText();
  if (salvo !== "22/10/2026 · 23:45") erros.push(`[${w}] reaberta: ${salvo}`);
  await foto("4-salvo-na-ficha");
  await ctx.close();
}
await b.close();
console.log(erros.length ? erros.join("\n") : "sem erros");
