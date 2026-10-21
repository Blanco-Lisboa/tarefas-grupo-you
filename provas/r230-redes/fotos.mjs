// Itens 230 e 232 (Sextante). Cópia de exemplo (3101, banco falso 3201 com /entrar); só olha e clica na ficha, fecha com Esc.
// 230: post sem programação abre SEM rede marcada (a prova tira o postar_em do card pela rede do navegador, page.route); programado abre
//      com as redes dele; Programar sem rede avisa "Escolha ao menos uma rede." e não grava.
// 232: o botão de data mostra 26/10/26 · 08:00, com ícone, data e seta no meio do botão.
// Uso: node provas/r230-redes/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };
const CARD = "Carrossel: calendário fiscal de novembro";

async function abrir(semProgramacao) {
  const pg = await (await navegador.newContext({ viewport: { width: 1440, height: 760 } })).newPage();
  if (semProgramacao) await pg.route("**/rest/v1/tarefas*", async (r) => { const res = await r.fetch(); await r.fulfill({ response: res, json: (await res.json()).map((t) => (t.titulo === CARD ? { ...t, postar_em: null } : t)) }); });
  const gravacoes = [];
  pg.on("request", (r) => { if (r.url().includes("/rpc/salvar_tarefa")) gravacoes.push(r.postDataJSON()); });
  await pg.goto("http://127.0.0.1:3201/entrar");
  await pg.goto("http://127.0.0.1:3101/conteudos", { waitUntil: "networkidle" });
  await pg.locator(".conteudos-cartao").filter({ hasText: CARD }).locator(".conteudos-titulo").click();
  const bloco = pg.locator(".ficha-cartao .publicacao");
  await bloco.waitFor();
  await pg.waitForTimeout(500);
  await bloco.evaluate((b) => b.scrollIntoView({ block: "center" }));
  await pg.mouse.move(5, 5);
  return { pg, bloco, gravacoes };
}
const marcadas = (bloco) => bloco.locator(".aprovacao-rede[aria-pressed=true]").evaluateAll((bs) => bs.map((b) => b.dataset.rede));
async function foto(pg, alvo, nome, folga = 12) {
  await pg.evaluate(() => document.getAnimations().filter((a) => a.animationName === "menu-brilho").forEach((a) => { a.pause(); a.currentTime = 1800; }));
  await pg.evaluate(() => {
    document.querySelector("#marca-largura")?.remove();
    const d = Object.assign(document.createElement("div"), { id: "marca-largura", textContent: `innerWidth ${innerWidth}` });
    d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
    document.body.append(d);
  });
  const c = await alvo.boundingBox();
  await pg.screenshot({ path: join(pasta, `${nome}.png`), clip: { x: c.x - folga, y: c.y - folga, width: c.width + 2 * folga, height: c.height + 2 * folga } });
}

// Sem programação, recém-aberta
let { pg, bloco, gravacoes } = await abrir(true);
confere((await marcadas(bloco)).length === 0, "230: sem programação abre sem nenhuma rede marcada");
await foto(pg, bloco, "230-sem-programacao-recem-aberta-1440");
await bloco.getByRole("button", { name: "Programar postagem" }).click();
await pg.waitForTimeout(400);
const aviso = await bloco.locator(".aprovacao-falta").innerText().catch(() => "");
confere(aviso.includes("Escolha ao menos uma rede.") && gravacoes.length === 0, `230: Programar sem rede avisa e não grava ("${aviso.replace(/\n/g, " | ")}")`);
await foto(pg, bloco, "230-programar-sem-rede-1440");
await bloco.locator(".aprovacao-rede[data-rede=instagram]").click();
await pg.mouse.move(5, 5);
await pg.waitForTimeout(300);
confere(JSON.stringify(await marcadas(bloco)) === '["instagram"]', "230: clicou no Instagram, só ele enche");
await foto(pg, bloco, "230-sem-programacao-clicou-instagram-1440");
await pg.context().close();

// Programado: abre com as redes dele; data 26/10/26 centralizada
({ pg, bloco } = await abrir(false));
confere(JSON.stringify(await marcadas(bloco)) === '["instagram","facebook"]', "230: programado abre com as redes dele cheias");
await foto(pg, bloco, "230-programado-1440");
const data = bloco.locator(".campo-data-botao");
const d = await data.evaluate((b) => {
  const caixa = b.getBoundingClientRect(), filhos = [...b.children].map((e) => e.getBoundingClientRect()).filter((r) => r.width);
  const esq = Math.min(...filhos.map((r) => r.left)) - caixa.left, dir = caixa.right - Math.max(...filhos.map((r) => r.right));
  return { texto: b.innerText.trim(), esq: Math.round(esq), dir: Math.round(dir) };
});
console.log("   data:", JSON.stringify(d));
confere(/^\d\d\/\d\d\/\d\d · \d\d:\d\d$/.test(d.texto), `232: data com o ano de 2 dígitos (${d.texto})`);
confere(Math.abs(d.esq - d.dir) <= 2, `232: ícone, data e seta no meio do botão (sobra ${d.esq}px à esquerda e ${d.dir}px à direita)`);
await foto(pg, data, "232-data-1440", 16);
await pg.context().close();
await navegador.close();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(falhas ? 1 : 0);
