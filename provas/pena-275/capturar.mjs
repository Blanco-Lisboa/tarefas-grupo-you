// Prova do item 275 (Caderno, duração): na cópia de exemplo (3101), escreve uma tarefa às 16:00, dá 2h pelo ⋮ e fotografa em 3 larguras.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const erros = [];
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  p.on("pageerror", (e) => erros.push(`[${w}] ${e.message}`));
  await p.goto("http://127.0.0.1:3201/entrar"); await p.goto("http://127.0.0.1:3101/tarefas", { waitUntil: "networkidle" });
  await p.waitForSelector(".folha-linhas");
  if (!(await p.locator(".linha", { hasText: "Roteiro longo" }).count())) { // a cópia guarda o que já foi criado: só cria na primeira largura
    const campo = p.getByLabel("Nova tarefa, 16:00").first();
    await campo.fill("Roteiro longo");
    await campo.press("Enter");
    const linha = p.locator(".linha", { hasText: "Roteiro longo" }).first();
    await linha.hover();
    await linha.getByRole("button", { name: /Mais opções/ }).click();
    await p.getByRole("button", { name: /^Duração/ }).click();
    await p.getByRole("button", { name: "2h", exact: true }).click();
  }
  await p.waitForTimeout(600);
  await p.locator(".linha[data-bloco]").first().scrollIntoViewIfNeeded();
  await p.evaluate(() => { const s = document.createElement("div"); s.textContent = `innerWidth ${innerWidth}`; s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px"; document.body.append(s); });
  const n = await p.locator(".linha[data-bloco]").first().evaluate((e) => e.getAttribute("style") + " h=" + e.offsetHeight);
  console.log(w, n);
  await p.screenshot({ path: join(PASTA, `${w}-bloco-2h.png`) });
  await p.close();
}
console.log("erros:", erros);
await nav.close();
