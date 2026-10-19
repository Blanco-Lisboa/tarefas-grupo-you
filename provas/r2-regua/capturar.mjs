import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const navegador = await chromium.launch({ headless: true, executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
const erros = [];

for (const [largura, altura] of [[1903, 900], [1440, 760], [390, 844]]) {
  const pagina = await navegador.newPage({ viewport: { width: largura, height: altura } });
  pagina.on("console", (mensagem) => { if (mensagem.type() === "error" && !mensagem.text().includes("WebSocket")) erros.push(`${largura}: ${mensagem.text()}`); });
  pagina.on("pageerror", (erro) => erros.push(`${largura}: ${erro.message}`));
  for (const tela of ["conteudos", "configuracoes"]) {
    await pagina.goto(`http://localhost:3100/${tela}`, { waitUntil: "networkidle" });
    const excesso = await pagina.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (excesso > 0) erros.push(`${largura} ${tela}: rolagem horizontal da página (${excesso}px)`);
    await pagina.evaluate(() => {
      const marca = document.createElement("div");
      marca.textContent = `innerWidth ${innerWidth}`;
      marca.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px;pointer-events:none";
      document.body.append(marca);
    });
    await pagina.screenshot({ path: join(pasta, `${largura}-${tela}.png`) });
    if (tela === "conteudos") {
      await pagina.locator(".conteudos-mover .selecao-botao").first().click();
      await pagina.waitForTimeout(250);
      await pagina.screenshot({ path: join(pasta, `${largura}-conteudos-selecao.png`) });
      await pagina.keyboard.press("Escape");
    }
  }
  await pagina.close();
}

const prova = await navegador.newPage();
let capturaFuncionou = false;
prova.on("console", (mensagem) => { if (mensagem.type() === "error" && mensagem.text().includes("PROVA DE CAPTURA")) capturaFuncionou = true; });
await prova.goto("http://localhost:3100/conteudos", { waitUntil: "networkidle" });
await prova.locator(".conteudos-mover .selecao-botao").first().click();
await prova.getByRole("group", { name: "Etapa" }).getByRole("button", { name: "Roteiro" }).click();
await prova.waitForTimeout(150);
if (!(await prova.locator(".conteudos-coluna").nth(1).getByRole("button", { name: "Ideias de Reels de outubro" }).isVisible())) {
  erros.push("A mudança de etapa pelo botão de seleção falhou");
}
await prova.evaluate(() => console.error("PROVA DE CAPTURA"));
await navegador.close();
if (!capturaFuncionou) erros.push("O teste do registro de erros falhou");
console.log(erros.length ? `Erros:\n${erros.join("\n")}` : "Capturas completas; sem erros de console ou rolagem horizontal da página.");
if (erros.length) process.exitCode = 1;
