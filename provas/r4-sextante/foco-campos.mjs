// Prova do item 72 (Sextante): foco sutil dos campos de escrever, vindo da base (globals.css).
// Três campos focados pelo teclado: Nova ideia (pastas), Notas da ficha e a linha do caderno. 1440 e 390.
// Chrome headless (fora da tela), servidor em 3100.
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
// Foco pelo teclado (Tab a partir do campo anterior) e conferência do estilo que chegou
async function conferir(p, w, nome, campo) {
  await campo.focus();
  await p.keyboard.press("Shift+Tab");
  await p.keyboard.press("Tab");
  const s = await campo.evaluate((e) => {
    const c = getComputedStyle(e);
    return { foco: e.matches(":focus-visible"), outline: `${c.outlineWidth} ${c.outlineStyle} ${c.outlineColor}`, sombra: c.boxShadow };
  });
  if (!s.foco) erros.push(`[${w}] ${nome}: sem :focus-visible`);
  if (s.outline !== "1px solid rgb(0, 100, 204)") erros.push(`[${w}] ${nome}: outline ${s.outline}`);
  if (!s.sombra.includes("0px 0px 0px 3px")) erros.push(`[${w}] ${nome}: halo ${s.sombra}`);
  await p.waitForTimeout(250);
  await foto(p, `${w}-foco-${nome}.png`);
}

for (const [w, h] of [[1440, 760], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erros.push(`[${w}] pageerror: ${e.message}`));

  // 1. Pastas: Nova ideia, campo Detalhe (o da foto 17)
  await p.goto("http://127.0.0.1:3100/pastas", { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  const ideias = p.locator(".pastas-empresa").first().locator(".gf-hit").nth(4);
  await ideias.scrollIntoViewIfNeeded(); await ideias.click(); await p.waitForTimeout(900);
  await p.locator(".gf-root[data-open] .gf-sheet").last().click({ force: true });
  await p.waitForSelector("dialog[open]");
  await p.getByRole("button", { name: "Voltar" }).click();
  await p.getByRole("button", { name: "+ Ideia" }).click();
  await conferir(p, w, "pastas-nova-ideia", p.locator("textarea[name=texto]"));

  // 2. Ficha: Notas
  await p.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
  await p.locator(".cal-nova").click();
  await p.locator(".ficha").waitFor();
  const notas = p.locator(".ficha textarea:not(.ficha-titulo)").first();
  await notas.scrollIntoViewIfNeeded();
  await conferir(p, w, "ficha-notas", notas);

  // 3. Caderno: linha de escrever tarefa
  await p.goto("http://127.0.0.1:3100/tarefas", { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await conferir(p, w, "caderno-linha", p.locator(".campo").first());
  await ctx.close();
}
await b.close();
console.log(erros.length ? erros.join("\n") : "sem erros");
