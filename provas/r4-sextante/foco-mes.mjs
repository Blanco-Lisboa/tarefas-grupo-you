// Prova do achado da Régua R4 (CampoData): trocar o mês pelas setas e depois usar o teclado na grade
// tem que partir do dia focado no mês NOVO. Chrome headless, servidor em 3100.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

const PASTA = fileURLToPath(new URL("./", import.meta.url));
const erros = [];
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 760 } })).newPage();
await p.clock.setFixedTime(new Date(2026, 9, 19, 15, 0));
await p.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
await p.locator(".cal-nova").click();
await p.locator(".campo-data-botao").first().click();
await p.waitForTimeout(350);
const pop = p.locator(".campo-data-pop:popover-open");
await pop.getByLabel("Próximo mês").click();
await pop.getByLabel("Próximo mês").click();
await p.keyboard.press("Tab"); // da seta "Próximo mês" para o dia tabulável da grade
const focado = () => p.evaluate(() => document.activeElement?.getAttribute("data-dia"));
if ((await focado()) !== "2026-12-01") erros.push(`Tab foi para ${await focado()}`);
await p.keyboard.press("ArrowRight");
await p.keyboard.press("ArrowDown");
const mes = await pop.locator(".campo-data-mes").innerText();
if (mes !== "Dezembro 2026" || (await focado()) !== "2026-12-09") erros.push(`depois das setas: ${mes} ${await focado()}`);
await p.evaluate(() => {
  const s = document.createElement("div");
  s.popover = "manual";
  s.textContent = `innerWidth ${innerWidth}`;
  s.style.cssText = "inset:auto 6px 6px auto;margin:0;border:0;background:#000;color:#fff;font:700 13px monospace;padding:3px 8px";
  document.body.append(s);
  s.showPopover();
});
await p.screenshot({ path: join(PASTA, "1440-data-foco-mes-novo.png") });
await b.close();
console.log(erros.length ? erros.join("\n") : "sem erros");
