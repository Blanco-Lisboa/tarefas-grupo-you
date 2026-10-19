// Item 109: a janela calendário+relógio do Começa/Termina abre inteira na tela, sem rolagem.
// Rodar (servidor em 3100 ligado): node provas/sextante/medir-item109.mjs [prefixo-das-fotos]
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const BASE = "http://localhost:3100";
const FOTOS = fileURLToPath(new URL("../../docs/referencias/2026-10-19-rodada-4/", import.meta.url));
const PREFIXO = process.argv[2] ?? "";
const TAMANHOS = [[1440, 760], [390, 844], [963, 633]];
const erros = [], medidas = [];

const b = await chromium.launch();
const novaPagina = async (o) => { const p = await b.newPage(o); p.setDefaultTimeout(8000); return p; };
for (const [w, h] of TAMANHOS) {
  for (const tela of ["calendario", "conteudos"]) {
    const p = await novaPagina({ viewport: { width: w, height: h } });
    p.on("pageerror", (e) => erros.push(`[${w} ${tela}] ${e.message}`));
    p.on("console", (m) => m.type() === "error" && !m.text().includes("WebSocket") && erros.push(`[${w} ${tela}] ${m.text()}`));
    await p.goto(`${BASE}/${tela}`, { waitUntil: "networkidle" });
    if (w === 1440 && tela === "calendario") await p.evaluate(() => console.error("ERRO DE PROPOSITO"));
    // Foto 65: o recarregamento a quente reinsere o selecao.css no fim e as regras gerais do seletor passam por cima das do
    // campo de data. Aqui as regras de .selecao-pop/.selecao-lista são repetidas no fim da página para provar que não vencem.
    await p.evaluate(() => {
      const regras = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } })
        .filter((r) => r.selectorText === ".selecao-pop" || r.selectorText === ".selecao-lista").map((r) => r.cssText);
      const s = document.createElement("style");
      s.textContent = regras.join("\n");
      document.head.append(s);
    });
    if (tela === "calendario") {
      if (w < 600) await p.getByRole("group", { name: "Visão do calendário" }).getByRole("button", { name: "Dia" }).click().catch(() => {});
      await p.locator(".evento-bloco:visible, .evento:visible").first().click();
    } else await p.locator(".conteudos-titulo").first().click();
    const d = p.locator("dialog.ficha[open]");
    await d.waitFor();
    // Garante Começa e Termina: tarefa sem data ganha hoje; dia inteiro é desmarcado
    const semData = d.locator('button.campo-data-botao[aria-label^="Data:"]');
    if (await semData.count()) {
      await semData.click();
      await p.locator(".campo-data-pop:popover-open .campo-data-pe button:last-child").click(); // Selecionar ou Hoje
    }
    const inteiro = d.getByRole("checkbox", { name: "Dia inteiro" });
    if ((await inteiro.count()) && (await inteiro.isChecked())) await inteiro.uncheck();
    for (const campo of ["Começa", "Termina"]) {
      const botao = d.locator(`button.campo-data-botao[aria-label^="${campo}:"]`);
      if (!(await botao.count())) { medidas.push({ w, tela, campo, falta: true }); continue; }
      await botao.scrollIntoViewIfNeeded();
      await botao.click();
      const pop = p.locator(".campo-data-pop:popover-open");
      await pop.waitFor();
      await p.waitForTimeout(300); // fim da animação de entrada
      const m = await pop.evaluate((el) => {
        const r = el.getBoundingClientRect(), f = document.querySelector("dialog.ficha[open]").getBoundingClientRect();
        const painel = el.querySelector(".campo-data-painel");
        const rodas = [...el.querySelectorAll(".roda")].map((x) => x.getBoundingClientRect());
        const arred = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v)]));
        return {
          janela: arred({ esq: r.left, dir: r.right, topo: r.top, base: r.bottom }),
          ficha: arred({ esq: f.left, dir: f.right, topo: f.top, base: f.bottom }),
          dentroTela: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
          rodasDentro: rodas.every((x) => x.left >= r.left && x.right <= r.right && x.right <= innerWidth),
          rolaPainel: painel.scrollWidth - painel.clientWidth + (painel.scrollHeight - painel.clientHeight),
          rolaPagina: document.documentElement.scrollWidth - innerWidth,
        };
      });
      medidas.push({ w, tela, campo, ...m });
      if (PREFIXO && w !== 963) {
        await p.evaluate(() => { const s = document.createElement("div"); s.textContent = `innerWidth ${innerWidth}`; s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px;pointer-events:none"; document.body.append(s); s.popover = "manual"; s.showPopover(); });
        await p.screenshot({ path: join(FOTOS, `${PREFIXO}-${tela}-${campo === "Começa" ? "comeca" : "termina"}-${w}.png`) });
      }
      await p.keyboard.press("Escape");
    }
    await p.close();
  }
}
await b.close();
for (const m of medidas) console.log(JSON.stringify(m));
console.log("ERROS", JSON.stringify(erros));
