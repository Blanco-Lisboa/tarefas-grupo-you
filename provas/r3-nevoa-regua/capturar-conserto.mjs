import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const navegador = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const erros = [];

try {
  for (const [largura, altura] of [[1440, 760], [390, 844]]) {
    const pagina = await navegador.newPage({ viewport: { width: largura, height: altura } });
    pagina.on("pageerror", (erro) => erros.push(`${largura}: ${erro.message}`));
    const marcar = async (alvo) => alvo.evaluate((el) => {
      const marca = document.createElement("span");
      marca.textContent = `innerWidth ${innerWidth}`;
      marca.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px";
      el.append(marca);
    });

    await pagina.goto("http://127.0.0.1:3100/configuracoes", { waitUntil: "networkidle" });
    await marcar(pagina.locator("body"));
    await pagina.screenshot({ path: join(pasta, `conserto-${largura}-configuracoes.png`) });
    await pagina.getByRole("button", { name: "Tirar", exact: true }).first().click();
    await pagina.getByRole("alertdialog").waitFor();
    await pagina.screenshot({ path: join(pasta, `conserto-${largura}-confirmacao.png`) });

    await pagina.goto("http://127.0.0.1:3100/conteudos", { waitUntil: "networkidle" });
    await marcar(pagina.locator("body"));
    await pagina.screenshot({ path: join(pasta, `conserto-${largura}-conteudos.png`) });
    await pagina.locator(".conteudos-titulo").first().click();
    const ficha = pagina.locator(".ficha");
    await marcar(ficha);
    await pagina.screenshot({ path: join(pasta, `conserto-${largura}-ficha.png`) });
    await ficha.locator(".ficha-grade .selecao-botao").first().click();
    await pagina.waitForTimeout(400);
    await pagina.screenshot({ path: join(pasta, `conserto-${largura}-ficha-selecao.png`) });
    await pagina.close();
  }
} finally {
  await navegador.close();
}
console.log("Erros de página:", erros.length ? erros : "nenhum");
