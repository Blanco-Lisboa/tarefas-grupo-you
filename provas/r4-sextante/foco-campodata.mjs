// Prova do ajuste do item 72/77 no CampoData (Sextante): todo controle do campo de data com o foco sutil da base
// (1px azul + halo), nenhum com o anel de 3px. Percorre o painel com Tab e mede o contorno de cada parada.
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
const contorno = (p) => p.evaluate(() => {
  const e = document.activeElement, c = getComputedStyle(e);
  return { nome: e.getAttribute("aria-label") || e.textContent.trim().slice(0, 12), largura: c.outlineWidth, sombra: c.boxShadow };
});

for (const [w, h] of [[1440, 760], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date(2026, 9, 19, 15, 0));
  await p.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
  await p.locator(".cal-nova").click();
  await p.locator(".ficha").waitFor();
  const botao = p.locator(".campo-data-botao").first();
  await botao.focus();
  await p.keyboard.press("Shift+Tab");
  await p.keyboard.press("Tab"); // foco no botão pelo teclado
  const visto = [await contorno(p)];
  await p.keyboard.press("Enter");
  await p.waitForTimeout(350);
  visto.push(await contorno(p)); // dia de hoje
  for (let i = 0; i < 4; i++) { await p.keyboard.press("Tab"); visto.push(await contorno(p)); } // hora, minuto, Limpar, Selecionar
  await p.keyboard.press("Shift+Tab");
  await p.keyboard.press("Shift+Tab");
  await p.keyboard.press("Shift+Tab");
  await p.keyboard.press("Shift+Tab");
  await p.keyboard.press("Shift+Tab");
  visto.push(await contorno(p)); // seta de mês
  for (const v of visto) if (v.largura !== "1px" || !v.sombra.includes("4px")) erros.push(`[${w}] ${v.nome}: ${v.largura} ${v.sombra}`);
  console.log(`[${w}] paradas conferidas: ${visto.map((v) => v.nome).join(" | ")}`);
  // Foto: coluna de minutos focada (o caso da 1440-data-hora-comeca.png)
  await p.locator('.campo-data-pop:popover-open [role=listbox][aria-label="Minuto"]').focus();
  await p.keyboard.press("ArrowDown");
  await p.waitForTimeout(400);
  await foto(p, `${w}-foco-campodata-minuto.png`);
  // Foto: dia escolhido (azul) com foco, o contorno tem que aparecer por fora
  await p.locator('.campo-data-pop:popover-open [data-dia="2026-10-19"]').click();
  await p.locator('.campo-data-pop:popover-open [data-dia="2026-10-19"]').focus();
  await p.keyboard.press("ArrowRight");
  await p.keyboard.press("ArrowLeft");
  await p.waitForTimeout(200);
  await foto(p, `${w}-foco-campodata-dia.png`);
  await ctx.close();
}
await b.close();
console.log(erros.length ? erros.join("\n") : "sem erros");
