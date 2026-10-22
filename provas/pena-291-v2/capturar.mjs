// Prova do item 291 v2 (mede as folgas da hora): horário no meio da faixa. Uso: node capturar.mjs antes|depois  (cópia de exemplo 3101 + banco falso 3201)
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const qual = process.argv[2] ?? "depois";
const nav = await chromium.launch({ headless: true });
const TAREFAS = [["Ajustar fotos", "09:30"], ["Subir post", "11:00"]]; // o resto (09:00, 10:30, 12:00, reunião 14:00) já vem na cópia de exemplo
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://127.0.0.1:3201/entrar");
  await p.goto("http://127.0.0.1:3101/tarefas", { waitUntil: "networkidle" });
  await p.waitForSelector(".folha-linhas");
  for (const [nome, hora] of TAREFAS) {
    if (await p.locator(".linha", { hasText: nome }).count()) continue;
    const campo = p.getByLabel(`Nova tarefa, ${hora}`).first();
    await campo.fill(nome); await campo.press("Enter"); await p.waitForTimeout(400);
  }
  await p.evaluate(() => { const s = document.createElement("div"); s.textContent = `innerWidth ${innerWidth}`; s.style.cssText = "position:fixed;left:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px"; document.body.append(s); });
  await p.locator(".pag-miolo").first().evaluate((e) => e.scrollTo(0, 60));
  await p.mouse.move(0, 0); await p.waitForTimeout(300);
  await p.screenshot({ path: join(PASTA, `${qual}-${w}.png`) });
  if (w === 1440) { // zoom: 4 faixas ao redor do 12:00, com a margem esquerda
    const cx = await p.locator(".linha", { hasText: "Pagar a ferramenta" }).first().boundingBox();
    const pag = await p.locator(".pag").first().boundingBox();
    await p.screenshot({ path: join(PASTA, `${qual}-zoom.png`), clip: { x: pag.x, y: cx.y - 36, width: 460, height: 36 * 6 } });
  }
  const m = await p.evaluate(() => { const li = document.querySelectorAll(".linha")[2], pag = li.closest(".pag").getBoundingClientRect(), c = li.querySelector(".linha-hora").getBoundingClientRect(), r = document.createRange(); r.selectNodeContents(li.querySelector(".linha-hora-txt")); const t = r.getBoundingClientRect(); return { esquerda: +(t.left - pag.left).toFixed(2), direita: +(c.right - t.right).toFixed(2) }; });
  console.log(qual, w, "folga borda->hora", m.esquerda, "px | hora->linha azul", m.direita, "px");
  await p.close();
}
await nav.close();
