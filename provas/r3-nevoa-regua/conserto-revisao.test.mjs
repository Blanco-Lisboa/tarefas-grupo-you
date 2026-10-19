import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const navegador = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});

try {
  const pagina = await navegador.newPage({ viewport: { width: 1440, height: 760 } });
  await pagina.goto("http://127.0.0.1:3100/configuracoes", { waitUntil: "networkidle" });

  const tirar = pagina.getByRole("button", { name: "Tirar", exact: true }).first();
  await tirar.click();
  const confirmacao = pagina.getByRole("alertdialog", { name: /Confirmar exclusão/ });
  await confirmacao.waitFor();
  assert.equal(
    await confirmacao.evaluate((el) => el.contains(document.activeElement)),
    true,
    "Ao abrir, o foco precisa entrar na confirmação de exclusão",
  );

  await confirmacao.getByRole("button", { name: "Cancelar" }).click();
  assert.equal(
    await pagina.evaluate(() => document.activeElement?.textContent?.trim()),
    "Tirar",
    "Ao cancelar, o foco precisa voltar ao botão Tirar",
  );

  await pagina.goto("http://127.0.0.1:3100/conteudos", { waitUntil: "networkidle" });
  await pagina.locator(".conteudos-titulo").first().click();
  const ficha = pagina.locator(".ficha");
  const escolhas = ficha.locator(".ficha-grade .selecao-botao");
  assert.equal(await escolhas.count(), 4, "Tipo, Empresa, Rede e Etapa usam o seletor comum");
  await escolhas.nth(0).click();
  await ficha.locator(".selecao-opcao").filter({ hasText: "Postagem" }).click();
  assert.match(await escolhas.nth(0).innerText(), /Postagem/);
  assert.equal(await ficha.getByPlaceholder("Para que serve este conteúdo?").count(), 1);

  const cores = ficha.locator(".ficha-cor");
  assert.equal(await cores.first().getAttribute("aria-pressed"), "true");
  await cores.nth(1).click();
  assert.equal(await cores.first().getAttribute("aria-pressed"), "false");
  assert.equal(await cores.nth(1).getAttribute("aria-pressed"), "true");
  console.log("Foco, seletores e paleta: passaram");
} finally {
  await navegador.close();
}
