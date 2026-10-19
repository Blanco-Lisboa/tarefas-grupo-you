import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const id = "C:/Users/Natham Monteiro/Desktop/ID-Visual-ALL/Beec/identidade";
const browser = await chromium.launch({ headless: true, executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
const erros = [];

function vigiar(page, nome) {
  page.on("pageerror", (erro) => erros.push(`${nome}: ${erro.message}`));
  page.on("console", (mensagem) => {
    if (mensagem.type() === "error" && !mensagem.text().includes("WebSocket") && !mensagem.text().includes("Failed to load resource")) erros.push(`${nome}: ${mensagem.text()}`);
  });
}

async function marcar(page) {
  await page.evaluate(() => {
    const selo = document.createElement("div");
    selo.textContent = `innerWidth ${innerWidth}`;
    selo.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px;pointer-events:none";
    document.body.append(selo);
  });
}

for (const [largura, altura] of [[1903, 900], [1440, 760], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width: largura, height: altura } });
  vigiar(page, `app-${largura}`);
  for (const rota of ["conteudos", "configuracoes"]) {
    await page.goto(`http://localhost:3100/${rota}`, { waitUntil: "networkidle" });
    const excesso = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (excesso > 0) erros.push(`${largura} ${rota}: rolagem horizontal da página (${excesso}px)`);
    await marcar(page);
    await page.screenshot({ path: join(pasta, `${largura}-${rota}.png`) });
    if (rota === "conteudos") {
      await page.locator(".conteudos-titulo").first().click();
      await page.screenshot({ path: join(pasta, `${largura}-ficha.png`) });
      await page.keyboard.press("Escape");
    }
  }
  await page.close();
}

for (const pagina of ["prancha.html", "cards-r1.html", "elementos-r7.html", "graficos-r3.html", "icones-r1.html"]) {
  const page = await browser.newPage({ viewport: { width: 1903, height: 900 } });
  await page.goto(pathToFileURL(join(id, pagina)).href, { waitUntil: "load" });
  if (pagina === "prancha.html") await page.locator("#comp .estados").scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(pasta, `id-${pagina.replace(".html", "")}.png`) });
  await page.close();
}

// Cada foto final reúne a tela e a prancha aberta pelo navegador, na mesma altura e escala.
for (const [nome, ref] of [["conteudos", "id-cards-r1"], ["configuracoes", "id-prancha"], ["ficha", "id-prancha"]]) {
  const [app, origem] = await Promise.all([
    readFile(join(pasta, `1903-${nome}.png`)), readFile(join(pasta, `${ref}.png`)),
  ]);
  const page = await browser.newPage({ viewport: { width: 3806, height: 900 }, deviceScaleFactor: 1 });
  await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;display:flex;background:#18131F}img{width:1903px;height:900px;object-fit:contain}</style><img alt="Tela" src="data:image/png;base64,${app.toString("base64")}"><img alt="ID" src="data:image/png;base64,${origem.toString("base64")}">`);
  await page.screenshot({ path: join(pasta, `lado-a-lado-${nome}.png`) });
  await page.close();
}

let provouConsole = false;
const prova = await browser.newPage();
prova.on("console", (m) => { if (m.type() === "error" && m.text() === "PROVA DO CONSOLE") provouConsole = true; });
await prova.goto("http://localhost:3100/conteudos");
await prova.evaluate(() => console.error("PROVA DO CONSOLE"));
await browser.close();
if (!provouConsole) erros.push("Escuta do console não funcionou");
console.log(erros.length ? erros.join("\n") : "Fotos completas e console sem erros.");
if (erros.length) process.exitCode = 1;
