// Rodada 4, Pena (item 63): contador do tamanho do botão, caderno mais acima, arraste da folha. Servidor em 3100.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const marca = (p) => p.evaluate(() => { document.getElementById("marca-iw")?.remove(); const d = document.createElement("div"); d.id = "marca-iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
const alt = (p) => p.evaluate(() => ({ contador: document.querySelector(".tarefas-contador")?.getBoundingClientRect().height, botao: document.querySelector(".tarefas-botao")?.getBoundingClientRect().height, filtroFim: Math.round(document.querySelector(".casca-barra")?.getBoundingClientRect().bottom), livroTopo: Math.round(document.querySelector(".livro-sombra").getBoundingClientRect().top), titulo: document.querySelector(".pag-faixa-sub")?.textContent }));
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h }, hasTouch: w === 390 });
  const erros = [];
  p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  p.on("pageerror", (e) => erros.push(String(e)));
  await p.goto("http://127.0.0.1:3100/tarefas", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await marca(p);
  await p.screenshot({ path: join(PASTA, `${w}-tarefas.png`) });
  console.log(w, JSON.stringify(await alt(p)));
  if (w === 1440) {
    const box = await p.locator(".livro-sombra").boundingBox();
    const y = box.y + box.height * 0.85, x0 = box.x + box.width * 0.45;
    await p.screenshot({ path: join(PASTA, `${w}-arraste-1-antes.png`) });
    await p.mouse.move(x0, y); await p.mouse.down();
    for (let i = 1; i <= 12; i++) await p.mouse.move(x0 - i * 22, y);
    await p.waitForTimeout(150);
    await marca(p);
    await p.screenshot({ path: join(PASTA, `${w}-arraste-2-no-meio.png`) });
    for (let i = 13; i <= 40; i++) await p.mouse.move(x0 - i * 22, y);
    await p.mouse.up();
    await p.waitForTimeout(1000);
    await marca(p);
    await p.screenshot({ path: join(PASTA, `${w}-arraste-3-depois-seguinte.png`) });
    console.log("depois de soltar longe:", (await alt(p)).titulo);
    // soltou perto: volta ao dia
    await p.mouse.move(x0, y); await p.mouse.down();
    for (let i = 1; i <= 6; i++) await p.mouse.move(x0 + i * 15, y);
    await p.waitForTimeout(100);
    await p.mouse.up();
    await p.waitForTimeout(1000);
    console.log("depois de soltar perto (direita, curto):", (await alt(p)).titulo);
    await p.getByRole("button", { name: "Hoje", exact: true }).click(); await p.waitForTimeout(900);
    console.log("Hoje:", (await alt(p)).titulo);
  }
  if (w === 390) {
    const box = await p.locator(".livro-sombra").boundingBox();
    const y = box.y + 330, x0 = box.x + box.width * 0.85;
    const cdp = await p.context().newCDPSession(p);
    const toque = (type, x) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
    await toque("touchStart", x0);
    for (let i = 1; i <= 10; i++) await toque("touchMove", x0 - i * 18);
    await p.waitForTimeout(150);
    await marca(p);
    await p.screenshot({ path: join(PASTA, `${w}-arraste-2-no-meio.png`) });
    for (let i = 11; i <= 14; i++) await toque("touchMove", x0 - i * 18);
    await toque("touchEnd", 0);
    await p.waitForTimeout(1000);
    await marca(p);
    await p.screenshot({ path: join(PASTA, `${w}-arraste-3-depois.png`) });
    console.log("390 depois do toque:", (await alt(p)).titulo);
  }
  console.log(w, "erros:", erros.length ? erros : "nenhum");
  await p.close();
}
await nav.close();
