// Prova do item 77 (Sextante): um contorno só, sutil (1px), padrão em todo o sistema, vindo da base.
// Mede o contorno de menu, botões (.btn, .btn-2), Selecao (botão e opção), botão claro no bloco azul e controles do caderno,
// e fotografa 3 deles focados pelo teclado em 1440. Chrome headless (fora da tela), servidor em 3100.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

const PASTA = fileURLToPath(new URL("./", import.meta.url));
const erros = [];
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 760 } })).newPage();
const marcar = () => p.evaluate(() => {
  document.getElementById("prova-iw")?.remove();
  const s = document.createElement("div");
  s.id = "prova-iw";
  s.popover = "manual";
  s.textContent = `innerWidth ${innerWidth}`;
  s.style.cssText = "inset:auto 6px 6px auto;margin:0;border:0;background:#000;color:#fff;font:700 13px monospace;padding:3px 8px;pointer-events:none";
  document.body.append(s);
  s.showPopover();
});
// Foco pelo teclado: foca o vizinho anterior e dá Tab, para valer o :focus-visible
async function focar(loc) {
  await loc.focus();
  await p.keyboard.press("Shift+Tab");
  await p.keyboard.press("Tab");
  await p.waitForTimeout(300); // a sombra do controle anterior termina de sumir (transição) antes da foto
}
async function medir(nome, cor = "rgb(0, 100, 204)") {
  const c = await p.evaluate(() => {
    const s = getComputedStyle(document.activeElement);
    return { w: s.outlineWidth, st: s.outlineStyle, cor: s.outlineColor, alvo: document.activeElement.className };
  });
  if (c.w !== "1px" || c.st !== "solid" || c.cor !== cor) erros.push(`${nome}: ${c.w} ${c.st} ${c.cor} (${c.alvo})`);
  return c;
}

await p.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await focar(p.locator('.menu a[href="/mapa"]'));
await medir("menu");
await marcar(); await p.screenshot({ path: join(PASTA, "1440-foco-sistema-menu.png") });
await focar(p.getByRole("button", { name: "Hoje", exact: true }));
await medir("btn-2 Hoje");
await marcar(); await p.screenshot({ path: join(PASTA, "1440-foco-sistema-botao.png") });
await focar(p.locator(".cal-nova"));
await medir("btn Nova tarefa");
await focar(p.locator(".selecao-botao", { hasText: "Etapa" }));
await medir("Selecao botão");
await p.keyboard.press("Enter");
await p.waitForTimeout(300);
await p.keyboard.press("Tab");
await p.keyboard.press("Tab");
await medir("Selecao opção");
await marcar(); await p.screenshot({ path: join(PASTA, "1440-foco-sistema-selecao.png") });
await p.keyboard.press("Escape");

// Bloco azul (contador do caderno) e controles do caderno
await p.goto("http://127.0.0.1:3100/tarefas", { waitUntil: "networkidle" });
const linha = p.locator(".linha").first();
await linha.hover();
const pontos = p.locator(".mt-pontos").first();
if (await pontos.count()) { await focar(pontos); await medir("caderno ⋮"); }
const alca = p.locator(".alca").first();
if (await alca.count()) { await focar(alca); await medir("caderno alça"); }
const claro = p.locator(".bloco-destaque :is(button, a)").first();
if (await claro.count()) { await focar(claro); await medir("botão no bloco azul", "rgb(255, 255, 255)"); }
await b.close();
console.log(erros.length ? erros.join("\n") : "sem erros");
