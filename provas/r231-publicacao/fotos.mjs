// Item 231 (Sextante): no bloco Publicação, data · Programar/Reprogramar · Postar agora com 1/3 cada, o mesmo vão e as bordas das redes.
// Cópia de exemplo (3101, banco falso 3201 com /entrar). Estados: programado (como vem), sem programação e com erro (a prova muda a
// resposta do banco no navegador com page.route: tira o postar_em / põe uma postagem com erro). Só olha; fecha com Esc.
// Uso: node provas/r231-publicacao/fotos.mjs
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

async function estado(nome, mexer) {
  const pg = await (await navegador.newContext({ viewport: { width: 1440, height: 760 } })).newPage();
  for (const x of [mexer ?? []].flat()) await pg.route(x.url, async (r) => { const res = await r.fetch(); await r.fulfill({ response: res, json: x.mudar(await res.json()) }); });
  await pg.goto("http://127.0.0.1:3201/entrar");
  await pg.goto("http://127.0.0.1:3101/conteudos", { waitUntil: "networkidle" });
  await pg.locator(".conteudos-cartao").filter({ hasText: CARD }).locator(".conteudos-titulo").click();
  const bloco = pg.locator(".ficha-cartao .publicacao");
  await bloco.waitFor();
  await pg.waitForTimeout(500);
  await bloco.evaluate((b) => b.scrollIntoView({ block: "center" }));
  await pg.mouse.move(5, 5);
  const m = await bloco.evaluate((b) => {
    const r = (e) => { const x = e.getBoundingClientRect(); return [Math.round(x.left * 10) / 10, Math.round(x.right * 10) / 10]; };
    const redes = [...b.querySelectorAll(".aprovacao-rede")].map(r);
    const acoes = [...b.querySelectorAll(".publicacao-acoes > *")].filter((e) => e.getBoundingClientRect().width).map(r);
    const corta = [...b.querySelectorAll(".publicacao-acoes .aprovacao-botao, .publicacao-acoes .campo-data-botao")].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.innerText);
    return { redes, acoes, textos: [...b.querySelectorAll(".publicacao-acoes > *")].filter((e) => e.getBoundingClientRect().width).map((e) => e.innerText.trim()), corta };
  });
  console.log(`   ${nome}:`, JSON.stringify(m));
  const larg = m.acoes.map(([a, b]) => b - a), vaos = m.acoes.slice(1).map(([a], i) => a - m.acoes[i][1]);
  if (m.acoes.length === 3) {
    confere(Math.max(...larg) - Math.min(...larg) < 1, `231 ${nome}: os 3 com a mesma largura (${larg.join(", ")})`);
    confere(Math.abs(vaos[0] - vaos[1]) < 1, `231 ${nome}: o mesmo vão entre eles (${vaos.join(", ")})`);
  } else confere(m.acoes.length === 1, `231 ${nome}: um botão só, na linha inteira`);
  confere(Math.abs(m.acoes[0][0] - m.redes[0][0]) < 1 && Math.abs(m.acoes.at(-1)[1] - m.redes.at(-1)[1]) < 1, `231 ${nome}: bordas iguais às das redes`);
  confere(m.corta.length === 0, `231 ${nome}: nenhum rótulo cortado`);
  await pg.evaluate(() => document.getAnimations().filter((a) => a.animationName === "menu-brilho").forEach((a) => { a.pause(); a.currentTime = 1800; }));
  await pg.evaluate(() => {
    const d = Object.assign(document.createElement("div"), { textContent: `innerWidth ${innerWidth}` });
    d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
    document.body.append(d);
  });
  const c = await bloco.boundingBox();
  await pg.screenshot({ path: join(pasta, `231-${nome}-perto-1440.png`), clip: { x: c.x - 12, y: c.y - 8, width: c.width + 24, height: c.height + 16 } });
  await pg.context().close();
}

await estado("programado");
await estado("sem-programacao", { url: "**/rest/v1/tarefas*", mudar: (l) => l.map((t) => (t.titulo === CARD ? { ...t, postar_em: null } : t)) });
let alvo; // id do card, lido da resposta das tarefas antes das postagens
await estado("com-erro", [
  { url: "**/rest/v1/tarefas*", mudar: (l) => { alvo = l.find((t) => t.titulo === CARD)?.id; return l; } },
  { url: "**/rest/v1/postagens*", mudar: (l) => [...l, { tarefa_id: alvo, rede: "instagram", status: "erro", link: null, erro: "a Meta recusou a imagem", postado_em: null }] },
]);
await navegador.close();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(falhas ? 1 : 0);
