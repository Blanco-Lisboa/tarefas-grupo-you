import assert from "node:assert/strict";
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

try {
  for (const [largura, altura] of [[1440, 760], [390, 844]]) {
    const pagina = await navegador.newPage({ viewport: { width: largura, height: altura } });
    await pagina.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
    const evento = pagina.locator("button.evento:visible").first();
    await evento.scrollIntoViewIfNeeded();
    await evento.click();
    const ficha = pagina.locator(".ficha");
    await ficha.waitFor();
    const titulo = ficha.locator(".ficha-titulo");
    await pagina.screenshot({ path: join(pasta, `ajuste-ficha-${largura}.png`) });
    const medidas = await titulo.evaluate((el) => ({
      texto: el.value,
      altura: el.clientHeight,
      alturaConteudo: el.scrollHeight,
      largura: el.clientWidth,
    }));
    assert.equal(medidas.texto, "Carrossel: tabela de preços");
    assert.ok(medidas.altura >= medidas.alturaConteudo, `Título cortado em ${largura}px: ${JSON.stringify(medidas)}`);
    if (largura === 390) assert.ok(medidas.altura > 40, "Título deve quebrar em 390px");

    await titulo.evaluate((el) => {
      el.form.requestSubmit = () => { window.__enviosTitulo = (window.__enviosTitulo || 0) + 1; };
    });
    await titulo.press("Enter");
    assert.equal(await pagina.evaluate(() => window.__enviosTitulo), 1, "Enter deve enviar o formulário");
    assert.equal(await titulo.inputValue(), "Carrossel: tabela de preços", "Enter não deve inserir quebra de linha");
    console.log(`${largura}px: título inteiro e Enter envia, ${JSON.stringify(medidas)}`);
    await pagina.close();
  }
} finally {
  await navegador.close();
}
