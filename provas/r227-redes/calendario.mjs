// Item 227, conferências do Calendário do 224 (cópia de exemplo 3101, banco falso 3201 com /entrar):
// (a) o filtro Agendas aparece quando há agendas: o banco de exemplo não tem nenhuma, então a prova responde agenda_acesso e
//     agenda_eventos pela rede do navegador (page.route), como o banco real responde para o Natham.
// (b) o bloco "Reunião com a Beec: metas do mês" (1 hora) mostra a linha "10:00 às 11:00" inteira.
// Uso: node provas/r227-redes/calendario.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };
const hoje = new Date(), dia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
for (const [w, h] of [[1440, 760], [1903, 900]]) {
  const pg = await (await navegador.newContext({ viewport: { width: w, height: h } })).newPage();
  await pg.route("**/rest/v1/agenda_acesso*", (r) => r.fulfill({ json: [{ fonte: "natham" }, { fonte: "contato" }], headers: { "access-control-allow-origin": "http://127.0.0.1:3101", "access-control-allow-credentials": "true" } }));
  await pg.route("**/rest/v1/agenda_eventos*", (r) => r.fulfill({ json: [{ id: "g1", fontes: ["natham"], titulo: "Dentista", particular: false, inicio: `${dia}T16:00`, fim: `${dia}T17:00`, dia_inteiro: false, local: null }], headers: { "access-control-allow-origin": "http://127.0.0.1:3101", "access-control-allow-credentials": "true" } }));
  await pg.goto("http://127.0.0.1:3201/entrar");
  await pg.goto("http://127.0.0.1:3101/calendario", { waitUntil: "networkidle" });
  await pg.waitForTimeout(800);
  const agendas = pg.locator(".cal-filtros .selecao-botao").filter({ hasText: "Agendas" });
  confere(await agendas.count() === 1 && await agendas.isVisible(), `(a) ${w}: filtro Agendas na barra quando há agendas`);
  const linhas = await pg.locator(".cal-barra").evaluate((b) => new Set([...b.querySelectorAll(".selecao-botao, .btn, h1")].filter((e) => e.offsetParent).map((e) => Math.round(e.getBoundingClientRect().top))).size);
  console.log(`   ${w}: barra em ${linhas} linha(s)`);
  const reuniao = pg.locator(".evento-bloco").filter({ hasText: "Reunião com a Beec" }).first();
  await reuniao.scrollIntoViewIfNeeded();
  const m = await reuniao.evaluate((b) => {
    const caixa = b.getBoundingClientRect(), det = b.querySelector(".evento-detalhes")?.getBoundingClientRect();
    return { bloco: [Math.round(caixa.top), Math.round(caixa.bottom)], hora: det && [Math.round(det.top), Math.round(det.bottom)], linhas: getComputedStyle(b).getPropertyValue("--linhas") };
  });
  console.log(`   ${w}: reunião`, JSON.stringify(m));
  confere(m.hora && m.hora[1] <= m.bloco[1], `(b) ${w}: "10:00 às 11:00" inteira dentro do bloco`);
  await pg.evaluate(() => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = 1800; }));
  await pg.evaluate(() => {
    const d = Object.assign(document.createElement("div"), { textContent: `innerWidth ${innerWidth}` });
    d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
    document.body.append(d);
  });
  await pg.screenshot({ path: join(pasta, `227-calendario-com-agendas-${w}.png`) });
  const c = await reuniao.boundingBox();
  await pg.screenshot({ path: join(pasta, `227-reuniao-1-hora-${w}.png`), clip: { x: c.x - 8, y: c.y - 8, width: c.width + 16, height: c.height + 16 } });
  await pg.context().close();
}
await navegador.close();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(falhas ? 1 : 0);
