// Item 69: alça de arrastar a tarefa para outro horário. Servidor em 3100.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const marca = (p) => p.evaluate(() => { document.getElementById("marca-iw")?.remove(); const d = document.createElement("div"); d.id = "marca-iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
const horas = (p) => p.evaluate(() => [...document.querySelectorAll(".folha .linha")].map((li) => [li.querySelector(".linha-hora")?.textContent, li.querySelector(".abrir")?.textContent]).filter((x) => x[1]));
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  const erros = []; p.on("pageerror", (e) => erros.push(String(e)));
  await p.goto("http://127.0.0.1:3100/tarefas", { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  const linha = p.locator(".folha .linha").filter({ has: p.locator(".alca") }).nth(1);
  await linha.hover();
  const a = await linha.locator(".alca").boundingBox();
  await marca(p);
  await p.screenshot({ path: join(PASTA, `${w}-alca-1-hover.png`) });
  console.log(w, "antes", JSON.stringify(await horas(p)));
  await p.mouse.move(a.x + 9, a.y + 18); await p.mouse.down();
  for (let i = 1; i <= 10; i++) await p.mouse.move(a.x + 9, a.y + 18 + i * 22);
  await p.waitForTimeout(150);
  await marca(p);
  await p.screenshot({ path: join(PASTA, `${w}-alca-2-arrastando.png`) });
  await p.mouse.up(); await p.waitForTimeout(500);
  await marca(p);
  await p.screenshot({ path: join(PASTA, `${w}-alca-3-depois.png`) });
  console.log(w, "depois", JSON.stringify(await horas(p)));
  // teclado
  const al = p.locator(".alca").first(); await al.focus();
  await p.keyboard.press("ArrowDown"); await p.waitForTimeout(300);
  console.log(w, "teclado ↓", JSON.stringify(await horas(p)), "foco na alça:", await p.evaluate(() => document.activeElement?.classList.contains("alca")));
  console.log(w, "erros:", erros.length ? erros : "nenhum");
  await p.close();
}
await nav.close();
