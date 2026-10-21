// Item 224 (Sextante): Calendário grande como o Google. Fotos na cópia de exemplo (3101, banco falso 3201 com /entrar), 1440x760 e 1903x900.
// Uso: node provas/r224-calendario/fotos.mjs antes|depois
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const fase = process.argv[2] ?? "depois";
const pasta = fileURLToPath(new URL("./", import.meta.url));
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };
for (const [w, h] of fase === "depois" ? [[1440, 760], [1903, 900], [390, 844]] : [[1440, 760], [1903, 900]]) {
  const pg = await (await navegador.newContext({ viewport: { width: w, height: h } })).newPage();
  await pg.goto("http://127.0.0.1:3201/entrar");
  await pg.goto("http://127.0.0.1:3101/calendario", { waitUntil: "networkidle" });
  await pg.waitForTimeout(800);
  const m = await pg.evaluate(() => {
    const grade = document.querySelector(".grade-janela");
    const r = grade?.getBoundingClientRect();
    const botoes = [...document.querySelectorAll("button")].filter((b) => !b.closest("[popover]")).map((b) => b.getAttribute("aria-label") || b.innerText.trim()).filter((t) => /^(Hoje|Semana anterior|Próxima semana|←|→)$/i.test(t));
    return { grade: grade && { classe: grade.className, top: Math.round(r.top), left: Math.round(r.left), largura: Math.round(r.width), altura: Math.round(r.height) }, botoes };
  });
  console.log(`   ${w}:`, JSON.stringify(m));
  if (fase === "depois") confere(m.botoes.length === 0, `224 (${w}): sem Hoje / ← / →`);
  await pg.evaluate(() => {
    const d = Object.assign(document.createElement("div"), { textContent: `innerWidth ${innerWidth}` });
    d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
    document.body.append(d);
  });
  await pg.screenshot({ path: join(pasta, `224-calendario-${fase}-${w}.png`) });
  if (fase === "depois") {
    const horas = await pg.locator(".grade-rolagem").evaluate((r) => Math.round((r.clientHeight / 48) * 10) / 10);
    console.log(`   ${w}: ${horas} horas à vista`);
    // Título clicável: abre o calendário de data e troca a semana
    const titulo = pg.locator(".cal-titulo .campo-data-titulo");
    const antes = await titulo.innerText();
    await titulo.click();
    const painel = pg.locator(".campo-data-pop:popover-open");
    confere(await painel.isVisible(), `224 (${w}): o título abre o calendário de data`);
    await pg.waitForTimeout(400); // o painel entra com uma transição curta
    if (w === 1440) await pg.screenshot({ path: join(pasta, "224-titulo-abre-data-1440.png") });
    await pg.keyboard.press("ArrowDown"); // uma semana depois
    await pg.keyboard.press("Enter");
    await pg.waitForTimeout(300);
    const depois = await titulo.innerText();
    confere(depois !== antes && !(await painel.isVisible()), `224 (${w}): escolher a data troca a semana ("${antes}" -> "${depois}")`);
  }
  await pg.context().close();
}
await navegador.close();
console.log(falhas ? `${falhas} FALHA(S)` : "fotos tiradas");
process.exit(falhas ? 1 : 0);
