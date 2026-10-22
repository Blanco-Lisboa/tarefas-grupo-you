// Prova do item 296: as 6 cores de linha no Dia e no Sem data, zoom ao lado da reunião, menu aberto, recarregar. Cópia de exemplo 3101 + banco falso 3201.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const p = await nav.newPage({ viewport: { width: 1903, height: 900 } });
const CORES = ["Azul", "Roxo", "Dourado", "Vermelho", "Verde", "Rosa"];
const abrir = async (semData) => {
  await p.goto("http://127.0.0.1:3201/entrar");
  await p.goto("http://127.0.0.1:3101/tarefas", { waitUntil: "networkidle" });
  if (semData) await p.getByRole("button", { name: "Sem data", exact: true }).click();
  await p.waitForSelector(".folha-linhas"); await p.waitForTimeout(800);
};
const marca = () => p.evaluate(() => { document.getElementById("marca")?.remove(); const s = document.createElement("div"); s.id = "marca"; s.textContent = `innerWidth ${innerWidth}`; s.style.cssText = "position:fixed;left:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px"; document.body.append(s); });
const pintar = async (li, cor) => {
  await li.scrollIntoViewIfNeeded(); await li.hover();
  await li.getByRole("button", { name: /Mais opções/ }).click();
  await p.locator(".mt-pop:popover-open").getByRole("button", { name: cor, exact: true }).click();
  await p.waitForTimeout(400);
};
const tarefas = () => p.locator(".linha:not([data-faixa=reuniao])").filter({ has: p.locator(".abrir") });
const foto = async (nome) => { await marca(); await p.mouse.move(0, 0); await p.waitForTimeout(300); await p.screenshot({ path: join(PASTA, nome) }); };

// ---- Dia
await abrir(false);
if (!(await p.locator(".linha", { hasText: "Linha dourada" }).count())) { const c = p.getByLabel("Nova tarefa, 13:30").first(); await c.fill("Linha dourada"); await c.press("Enter"); await p.waitForTimeout(700); }
const dia = tarefas().filter({ hasNotText: "Linha dourada" });
for (let i = 0; i < 5; i++) await pintar(dia.nth(i), ["Azul", "Roxo", "Vermelho", "Verde", "Rosa"][i]);
await pintar(p.locator(".linha", { hasText: "Linha dourada" }).first(), "Dourado");
await p.locator(".pag-miolo").first().evaluate((e) => e.scrollTo(0, 120));
await foto("dia-1903.png");
const ouro = await p.locator(".linha", { hasText: "Linha dourada" }).first().boundingBox(), pag = await p.locator(".pag").first().boundingBox();
await p.screenshot({ path: join(PASTA, "zoom-dourado-e-reuniao.png"), clip: { x: pag.x, y: ouro.y - 8, width: pag.width, height: 36 * 3 + 16 } });
const l0 = dia.nth(0); await l0.hover(); await l0.getByRole("button", { name: /Mais opções/ }).click(); await p.waitForTimeout(400);
await foto("dia-menu-aberto.png");
await p.keyboard.press("Escape");
await abrir(false); await p.locator(".pag-miolo").first().evaluate((e) => e.scrollTo(0, 120)); await foto("dia-1903-recarregado.png");
console.log("Dia depois de recarregar:", await p.locator(".linha[data-cor-linha]").evaluateAll((ls) => ls.map((l) => l.dataset.corLinha)));

// ---- Sem data
await abrir(true);
const sd = tarefas();
console.log("tarefas sem data:", await sd.count());
for (let i = 0; i < Math.min(6, await sd.count()); i++) await pintar(sd.nth(i), CORES[i]);
await foto("semdata-1903.png");
await abrir(true); await foto("semdata-1903-recarregado.png");
console.log("Sem data depois de recarregar:", await p.locator(".linha[data-cor-linha]").evaluateAll((ls) => ls.map((l) => l.dataset.corLinha)));
await nav.close();
