import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const navegador = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const erros = [];

for (const [largura, altura] of [[1903, 900], [1440, 760], [390, 844]]) {
  const pagina = await navegador.newPage({ viewport: { width: largura, height: altura } });
  pagina.on("pageerror", (erro) => erros.push(`${largura}: ${erro.message}`));
  for (const rota of ["conteudos", "configuracoes"]) {
    await pagina.goto(`http://127.0.0.1:3100/${rota}`, { waitUntil: "networkidle" });
    await pagina.evaluate(() => {
      const marca = document.createElement("div");
      marca.textContent = `innerWidth ${innerWidth}`;
      marca.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px";
      document.body.append(marca);
    });
    await pagina.screenshot({ path: join(pasta, `${largura}-${rota}.png`) });
  }
  await pagina.goto("http://127.0.0.1:3100/conteudos", { waitUntil: "networkidle" });
  await pagina.locator(".conteudos-titulo").first().click();
  await pagina.evaluate(() => {
    const marca = document.createElement("div");
    marca.textContent = `innerWidth ${innerWidth}`;
    marca.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px";
    document.querySelector(".ficha").append(marca);
  });
  await pagina.screenshot({ path: join(pasta, `${largura}-ficha.png`) });
  await pagina.close();
}

const modelo = await navegador.newPage({ viewport: { width: 1440, height: 760 } });
await modelo.goto("http://127.0.0.1:3100/modelos", { waitUntil: "networkidle" });
await modelo.locator("#modelo-1").screenshot({ path: join(pasta, "1440-modelo-1.png") });
await modelo.close();
await navegador.close();
console.log("Erros de página:", erros.length ? erros : "nenhum");
