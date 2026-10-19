// Item 70: menu ⋮ da tarefa. Servidor em 3100.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const marca = (p) => p.evaluate(() => { document.getElementById("marca-iw")?.remove(); const d = document.createElement("div"); d.id = "marca-iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
const lista = (p) => p.evaluate(() => [...document.querySelectorAll(".folha .linha")].map((li) => li.querySelector(".abrir")?.textContent && [li.querySelector(".linha-hora")?.textContent, li.querySelector(".abrir").textContent, li.querySelector(".detalhe")?.textContent]).filter(Boolean));
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  const erros = []; p.on("pageerror", (e) => erros.push(String(e)));
  await p.goto("http://127.0.0.1:3100/tarefas", { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  const linha = () => p.locator(".folha .linha").filter({ has: p.locator(".mt-pontos") }).nth(1);
  await linha().hover();
  await marca(p);
  await p.screenshot({ path: join(PASTA, `${w}-menu-1-hover.png`) });
  await linha().locator(".mt-pontos").click(); await p.waitForTimeout(400);
  await marca(p);
  await p.screenshot({ path: join(PASTA, `${w}-menu-2-aberto.png`) });
  if (w === 1440) {
    await p.getByRole("button", { name: "Marcar horário…" }).click(); await p.waitForTimeout(250);
    await p.screenshot({ path: join(PASTA, `${w}-menu-3-horarios.png`) });
    await p.getByRole("button", { name: "Voltar" }).click();
    await p.getByRole("button", { name: "Prioridade" }).click(); await p.waitForTimeout(400);
    await linha().locator(".mt-pontos").click(); await p.waitForTimeout(300);
    await p.getByRole("button", { name: "Duplicar pro dia seguinte" }).click(); await p.waitForTimeout(400);
    await p.getByRole("button", { name: "Próximo dia" }).click(); await p.waitForTimeout(900);
    console.log("dia seguinte tem:", JSON.stringify(await lista(p)));
    await p.getByRole("button", { name: "Dia anterior" }).click(); await p.waitForTimeout(900);
    await linha().locator(".mt-pontos").click(); await p.waitForTimeout(300);
    await p.keyboard.press("Escape"); await p.waitForTimeout(300);
    console.log("Esc fecha:", await p.evaluate(() => !document.querySelector(".mt-pop:popover-open")));
    await linha().locator(".mt-pontos").click(); await p.waitForTimeout(300);
    await p.getByRole("button", { name: "Excluir" }).click(); await p.waitForTimeout(300);
    await marca(p);
    await p.screenshot({ path: join(PASTA, `${w}-menu-4-excluir-confirma.png`) });
    console.log("etiqueta aplicada:", await p.evaluate(() => getComputedStyle(document.querySelector(".ag-card, .ag-inteiro")).getPropertyValue("--etq")));
  }
  console.log(w, "erros:", erros.length ? erros : "nenhum");
  await p.close();
}
await nav.close();
