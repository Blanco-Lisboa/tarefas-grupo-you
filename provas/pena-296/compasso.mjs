// Prova do 297: o brilho está na MESMA posição em várias linhas, em 3 instantes, incluindo uma linha recém-colorida e uma troca Dia/Sem data.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const p = await nav.newPage({ viewport: { width: 1903, height: 900 } });
await p.goto("http://127.0.0.1:3201/entrar");
await p.goto("http://127.0.0.1:3101/tarefas", { waitUntil: "networkidle" });
await p.waitForSelector(".folha-linhas"); await p.waitForTimeout(800);
const fases = () => p.evaluate(() => [...document.querySelectorAll(".linha[data-cor-linha], .linha[data-faixa=reuniao]")].map((l) => ({ t: l.querySelector(".abrir")?.textContent?.slice(0, 14), pos: getComputedStyle(l).backgroundPosition.split(",")[0].trim() })));
const mostrar = async (rotulo) => { const f = await fases(); console.log(rotulo, JSON.stringify(f)); const distintas = new Set(f.map((x) => x.pos)).size; console.log("  linhas:", f.length, "| posições distintas:", distintas); };
const pintar = async (li, cor) => { await li.hover(); await li.getByRole("button", { name: /Mais opções/ }).click(); await p.locator(".mt-pop:popover-open").getByRole("button", { name: cor, exact: true }).click(); await p.waitForTimeout(300); };
const sem = p.locator(".linha:not([data-cor-linha]):not([data-faixa=reuniao])").filter({ has: p.locator(".abrir") });
await pintar(sem.nth(0), "Rosa");
await p.waitForTimeout(1100); // a próxima cor nasce ~1,1 s depois das outras: fora de fase se não houver sincronia
await pintar(sem.nth(0), "Verde");
for (const [i, atraso] of [[1, 0], [2, 700], [3, 900]]) { await p.waitForTimeout(atraso); await mostrar(`instante ${i} (Dia)`); await p.screenshot({ path: join(PASTA, `compasso-dia-${i}.png`), clip: { x: 200, y: 200, width: 840, height: 460 } }); }
await p.getByRole("button", { name: "Sem data", exact: true }).click(); await p.waitForTimeout(500); await mostrar("depois de trocar para Sem data");
await p.getByRole("button", { name: "Dia", exact: true }).click(); await p.waitForTimeout(500); await mostrar("depois de voltar ao Dia");
await nav.close();
