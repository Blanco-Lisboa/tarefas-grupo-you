// Prova da Fase 1 da rodada 2 (base visual + casca). Servidor em 3100 ligado: node provas/r2-sextante/capturar.mjs [prefixo]
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

const BASE = "http://localhost:3100";
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const PREFIXO = process.argv[2] ?? "depois";
const TAMANHOS = [[1903, 900], [1440, 760], [390, 844]];
const TELAS = ["calendario", "tarefas", "conteudos", "pastas", "configuracoes", "mapa"];
const erros = [];

const navegador = await chromium.launch({ headless: true });
const marcar = (p) => p.evaluate(() => {
  const s = document.createElement("div");
  s.textContent = `innerWidth ${innerWidth}`;
  s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px;pointer-events:none";
  document.body.append(s);
});

for (const [w, h] of TAMANHOS) {
  const contexto = await navegador.newContext({ viewport: { width: w, height: h } });
  const p = await contexto.newPage();
  p.on("console", (m) => m.type() === "error" && !m.text().includes("WebSocket") && erros.push(`[${w}] console: ${m.text()}`));
  p.on("pageerror", (e) => erros.push(`[${w}] pageerror: ${e.message}`));
  for (const tela of TELAS) {
    await p.goto(`${BASE}/${tela}`, { waitUntil: "networkidle" });
    const larg = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (larg > 0) erros.push(`[${w}] ${tela}: página rola na horizontal (${larg}px)`);
    await marcar(p);
    await p.screenshot({ path: join(PASTA, `${PREFIXO}-${w}-${tela}.png`) });
  }
  if (PREFIXO !== "antes") {
    // Botão de seleção de empresa aberto, com uma empresa escolhida.
    await p.goto(`${BASE}/calendario`, { waitUntil: "networkidle" });
    const botao = p.locator(".selecao-botao").first();
    await botao.click();
    await p.locator(".selecao-opcao").nth(1).click();
    await p.waitForTimeout(300);
    await marcar(p);
    await p.screenshot({ path: join(PASTA, `${PREFIXO}-${w}-selecao-aberta.png`) });
    await p.keyboard.press("Escape");
    // Recolher, recarregar e conferir que lembrou (só desktop: no celular o menu já é só ícones).
    if (w > 767) {
      // Teclado e não clique: no servidor de desenvolvimento o selo "N" do Next fica por cima deste canto.
      await p.getByRole("button", { name: "Recolher menu" }).focus();
      await p.keyboard.press("Enter");
      await p.reload({ waitUntil: "networkidle" });
      const lembrou = await p.evaluate(() => document.documentElement.dataset.menu === "recolhido" ? "true" : "false");
      if (lembrou !== "true") erros.push(`[${w}] menu recolhido não foi lembrado depois de recarregar`);
      await marcar(p);
      await p.screenshot({ path: join(PASTA, `${PREFIXO}-${w}-recolhido.png`) });
      await p.getByRole("button", { name: "Expandir menu" }).focus();
      await p.keyboard.press("Enter");
    }
    // Limpa o filtro para não sujar a próxima rodada.
    await p.evaluate(() => localStorage.clear());
  }
  await contexto.close();
}
// Prova de que o log captura: um erro de propósito numa página à parte, para o selo de erro do Next não sujar as fotos.
const prova = await navegador.newPage();
prova.on("console", (m) => m.type() === "error" && erros.push(`[prova] console: ${m.text()}`));
await prova.goto(`${BASE}/calendario`, { waitUntil: "networkidle" });
await prova.evaluate(() => console.error("ERRO DE PROPOSITO (prova de que o log captura)"));
await navegador.close();
console.log(erros.length ? "ERROS:\n" + erros.join("\n") : "sem erros");
