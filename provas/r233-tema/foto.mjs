// Item 233 (Sextante): o campo "Tema (pasta no Drive)" de ponta a ponta na ficha (largura de Tipo + Empresa), ajuda embaixo na
// largura toda e a lista que abre na mesma largura. Cópia de exemplo (3101, banco falso 3201 com /entrar); só olha, fecha com Esc.
// Uso: node provas/r233-tema/foto.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const pg = await (await navegador.newContext({ viewport: { width: 1440, height: 760 } })).newPage();
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };
await pg.goto("http://127.0.0.1:3201/entrar");
await pg.goto("http://127.0.0.1:3101/conteudos", { waitUntil: "networkidle" });
await pg.locator(".conteudos-cartao").filter({ hasText: "Carrossel: calendário fiscal de novembro" }).locator(".conteudos-titulo").click();
const ficha = pg.locator(".ficha-cartao");
await ficha.waitFor();
await pg.waitForTimeout(500);
const marca = () => pg.evaluate(() => {
  document.querySelector("#marca-largura")?.remove();
  const d = Object.assign(document.createElement("div"), { id: "marca-largura", textContent: `innerWidth ${innerWidth}` });
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
  document.body.append(d);
});
const caixa = (s) => ficha.locator(s).first().evaluate((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; });
const tipo = await caixa(".ficha-grade > .ficha-escolha:nth-child(1) .selecao-botao");
const empresa = await caixa(".ficha-grade > .ficha-escolha:nth-child(2) .selecao-botao");
const tema = await caixa(".ficha-tema .selecao-botao");
const ajuda = await caixa(".ficha-tema .ficha-dica");
console.log("   tipo", tipo, "empresa", empresa, "tema", tema, "ajuda", ajuda);
confere(tema[0] === tipo[0] && tema[1] === empresa[1], "233: Tema de ponta a ponta (borda esquerda do Tipo à direita da Empresa)");
confere(ajuda[0] === tema[0] && ajuda[1] === tema[1], "233: frase de ajuda na largura toda");
await marca();
await pg.screenshot({ path: join(pasta, "233-tema-ponta-a-ponta-1440.png") });
await ficha.locator(".ficha-tema .selecao-botao").click();
await pg.waitForTimeout(400);
const lista = await pg.locator(".ficha-tema .selecao-pop:popover-open").evaluate((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; });
console.log("   lista", lista);
confere(lista[0] === tema[0] && lista[1] === tema[1], "233: a lista abre na mesma largura do campo");
await marca();
await pg.screenshot({ path: join(pasta, "233-tema-aberto-1440.png") });
await navegador.close();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(falhas ? 1 : 0);
