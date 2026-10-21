// Item 238 (Sextante, textos): com a postagem automática DESLIGADA, nenhum lugar diz "Programado": o card da Esteira diz "Hora marcada".
// Cópia de exemplo (3101, banco falso 3201 com /entrar), que roda DESLIGADA; "ligada" é a resposta true dada pela rede do navegador
// (page.route) à pergunta postagem_automatica_ligada. Também varre o texto do Calendário e do Mapa. Só olha.
// Uso: node provas/r238-publicacao/esteira.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };
const CORS = { "access-control-allow-origin": "http://127.0.0.1:3101", "access-control-allow-credentials": "true" };
const CARD = "Carrossel: calendário fiscal de novembro";

async function abrir(ligada, tela) {
  const pg = await (await navegador.newContext({ viewport: { width: 1440, height: 760 } })).newPage();
  if (ligada) await pg.route("**/rest/v1/rpc/postagem_automatica_ligada*", (r) => r.fulfill({ json: true, headers: CORS }));
  await pg.goto("http://127.0.0.1:3201/entrar");
  await pg.goto(`http://127.0.0.1:3101/${tela}`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(1000);
  return pg;
}
const linhaDoCard = (pg) => pg.locator(".conteudos-cartao").filter({ hasText: CARD }).locator(".aprovacao-situacao").innerText();

let pg = await abrir(false, "conteudos");
const desligada = await linhaDoCard(pg);
confere(/^Hora marcada · /.test(desligada), `238 desligada: card da Esteira diz "${desligada}"`);
const programados = await pg.locator("body").evaluate((b) => (b.innerText.match(/Programad[oa]|programação/gi) ?? []).length);
confere(programados === 0, `238 desligada: nenhum "Programado/programação" na Esteira (${programados})`);
const beec = await pg.locator("body").evaluate((b) => [(b.innerText.match(/só para a You/g) ?? []).length, (b.innerText.match(/Postagem automática ainda desligada/g) ?? []).length]);
confere(beec[0] === 0 && beec[1] > 0, `238 desligada: card da Beec diz "Postagem automática ainda desligada" (${JSON.stringify(beec)})`);
const card = pg.locator(".conteudos-cartao").filter({ hasText: CARD });
await card.scrollIntoViewIfNeeded();
await pg.evaluate(() => {
  const d = Object.assign(document.createElement("div"), { textContent: `innerWidth ${innerWidth}` });
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
  document.body.append(d);
});
await pg.screenshot({ path: join(pasta, "238-esteira-hora-marcada-1440.png") });
const c = await card.boundingBox();
await pg.screenshot({ path: join(pasta, "238-esteira-hora-marcada-perto-1440.png"), clip: { x: c.x - 12, y: c.y - 12, width: c.width + 24, height: c.height + 24 } });
await pg.context().close();

for (const tela of ["calendario", "mapa"]) {
  pg = await abrir(false, tela);
  const n = await pg.locator("body").evaluate((b) => (b.innerText.match(/Programad[oa]|programação/gi) ?? []).length);
  confere(n === 0, `238 desligada: nenhum "Programado/programação" no ${tela} (${n})`);
  await pg.context().close();
}

pg = await abrir(true, "conteudos");
const ligada = await linhaDoCard(pg);
confere(/^Programado · /.test(ligada), `238 ligada: card da Esteira como hoje ("${ligada}")`);
await pg.context().close();

await navegador.close();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(falhas ? 1 : 0);
