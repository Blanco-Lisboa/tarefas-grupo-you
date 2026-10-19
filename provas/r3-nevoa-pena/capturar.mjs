// Fotos da tela Tarefas na Névoa (item 60, Fase 2). Servidor em 3100 ligado.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const marca = (p) => p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  const erros = [];
  p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  p.on("pageerror", (e) => erros.push(String(e)));
  await p.goto("http://127.0.0.1:3100/tarefas", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await marca(p);
  await p.screenshot({ path: join(PASTA, `${w}-tarefas.png`) });
  if (w === 390) {
    await p.getByRole("button", { name: "Agenda", exact: true }).click();
    await p.waitForTimeout(400);
    await p.screenshot({ path: join(PASTA, `${w}-agenda.png`) });
  } else if (w === 1440) {
    await p.getByRole("button", { name: "Sem data" }).click();
    await p.waitForTimeout(500);
    await p.screenshot({ path: join(PASTA, `${w}-sem-data.png`) });
    await p.goto("http://127.0.0.1:3100/tarefas/letras", { waitUntil: "networkidle" });
    await p.waitForTimeout(500);
    await p.screenshot({ path: join(PASTA, `${w}-letras.png`) });
  }
  console.log(w, "erros:", erros.length ? erros : "nenhum");
  await p.close();
}
await nav.close();
