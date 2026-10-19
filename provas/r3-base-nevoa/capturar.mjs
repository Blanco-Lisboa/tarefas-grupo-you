// Fotos da base Névoa (item 60, Fase 1): todas as telas em 1903x900, 1440x760 e 390x844, mais seleção aberta,
// menu recolhido e o bloco de destaque. Servidor em 3100 ligado.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const PORTA = process.env.PORTA ?? "3100";
const TELAS = ["calendario", "mapa", "tarefas", "conteudos", "pastas", "configuracoes"];
const nav = await chromium.launch({ headless: true });
const marca = (p) => p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
const erros = [];
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  p.on("pageerror", (e) => erros.push(`${w} ${e}`));
  for (const t of TELAS) {
    await p.goto(`http://127.0.0.1:${PORTA}/${t}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1200);
    await marca(p);
    await p.screenshot({ path: join(PASTA, `${w}-${t}.png`) });
  }
  await p.close();
}
const p = await nav.newPage({ viewport: { width: 1440, height: 760 } });
await p.goto(`http://127.0.0.1:${PORTA}/conteudos`, { waitUntil: "networkidle" });
await p.locator(".selecao-botao").first().click();
await p.waitForTimeout(500);
await p.locator(".selecao-opcao").nth(1).click();
await p.waitForTimeout(400);
await p.locator(".menu-item").nth(1).hover();
await marca(p);
await p.screenshot({ path: join(PASTA, "1440-selecao-aberta.png"), clip: { x: 0, y: 0, width: 720, height: 420 } });
// Bloco de destaque: amostra montada só na foto (nenhuma tela usa ainda; é para a Fase 2)
await p.keyboard.press("Escape");
await p.evaluate(() => {
  const d = document.createElement("div");
  d.style.cssText = "display:flex;gap:12px;margin:16px 0";
  d.innerHTML = `<div class="bloco-destaque" style="width:260px"><p class="bloco-fraco">Neste mês</p><p class="bloco-numero">12</p><p class="bloco-fraco">conteúdos a postar</p></div>
  <div class="bloco-destaque" style="width:260px;display:grid;gap:12px"><p style="font-weight:600">Sem data</p><button class="btn btn-claro">+ Tarefa sem data</button></div>
  <div style="display:flex;gap:8px;align-items:center"><button class="btn">Nova tarefa</button><button class="btn btn-2">Hoje</button><a class="lnk" href="#">Ver todos</a></div>`;
  document.querySelector(".casca-barra").after(d);
});
await p.waitForTimeout(300);
await p.screenshot({ path: join(PASTA, "1440-bloco-e-botoes.png"), clip: { x: 0, y: 0, width: 1100, height: 320 } });
await p.evaluate(() => { localStorage.setItem("grade:menu-recolhido", "1"); });
await p.goto(`http://127.0.0.1:${PORTA}/calendario`, { waitUntil: "networkidle" });
await p.waitForTimeout(800);
await marca(p);
await p.screenshot({ path: join(PASTA, "1440-menu-recolhido.png") });
console.log("recolhido lembrado:", await p.evaluate(() => document.documentElement.dataset.menu));
await p.evaluate(() => localStorage.removeItem("grade:menu-recolhido"));
console.log("erros:", erros.length ? erros : "nenhum");
await nav.close();
