// Prova do 294: escrever na página da direita, arrastar entre páginas, trocar de lugar (soltar em cima de outra tarefa), recarregar.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const p = await nav.newPage({ viewport: { width: 1903, height: 900 } });
const abrir = async () => {
  await p.goto("http://127.0.0.1:3201/entrar");
  await p.goto("http://127.0.0.1:3101/tarefas", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Sem data", exact: true }).click();
  await p.waitForSelector(".folha-linhas"); await p.waitForTimeout(800);
};
const mapa = () => p.locator(".linha[data-k]").evaluateAll((ls) => ls.map((l) => (l.querySelector(".abrir") ? `${l.dataset.k}:${l.querySelector(".abrir").textContent}` : null)).filter(Boolean));
const marca = () => p.evaluate(() => { const s = document.createElement("div"); s.textContent = `innerWidth ${innerWidth}`; s.style.cssText = "position:fixed;left:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px"; document.body.append(s); });
const arrastar = async (nome, kAlvo) => {
  const li = p.locator(".linha", { hasText: nome }).first();
  await li.hover();
  const a = await li.locator(".alca").boundingBox();
  const alvo = await p.locator(`.linha[data-k="${kAlvo}"]`).boundingBox();
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down();
  await p.mouse.move(alvo.x + 300, alvo.y + alvo.height / 2, { steps: 20 }); await p.mouse.up();
  await p.waitForTimeout(900);
};
await abrir();
const nEsq = Number(await p.locator(".pag").nth(1).locator(".linha[data-k]").first().getAttribute("data-k"));
console.log("linhas por página (nEsq):", nEsq);
const livres = async () => p.locator(".linha[data-k]").evaluateAll((ls) => ls.filter((l) => l.querySelector("input.campo")).map((l) => Number(l.dataset.k)));
const escrever = async (k, nome) => { const c = p.locator(`.linha[data-k="${k}"] input.campo`); await c.fill(nome); await c.press("Enter"); await p.waitForTimeout(700); };
const id = String(Date.now()).slice(-3), L = await livres(), esq = L.filter((k) => k < nEsq && k > 6), dir = L.filter((k) => k >= nEsq + 2);
const [e1, e2] = [esq[1], esq[4]], [d1, d2] = [dir[1], dir[4]];
await escrever(e1, `Esq ${id}`); await escrever(e2, `Esq2 ${id}`); await escrever(d1, `Dir ${id}`);
console.log("1) escritas (esq", e1, e2, "dir", d1, ") antes de recarregar:", (await mapa()).filter((x) => x.includes(id)));
await arrastar(`Esq ${id}`, d2); // da esquerda para a direita
console.log("2) 'Esq' arrastada para a linha", d2, ":", (await mapa()).filter((x) => x.includes(id)));
await arrastar(`Dir ${id}`, e2); // cai em cima de Esq2: trocam
console.log("3) 'Dir' solta em cima de 'Esq2' (linha", e2, ") = trocam:", (await mapa()).filter((x) => x.includes(id)));
await marca(); await p.mouse.move(0, 0);
await p.screenshot({ path: join(PASTA, "direita-1903.png") });
await abrir(); await marca(); await p.mouse.move(0, 0);
console.log("4) depois de recarregar:", (await mapa()).filter((x) => x.includes(id)));
await p.screenshot({ path: join(PASTA, "direita-1903-recarregado.png") });
await nav.close();
