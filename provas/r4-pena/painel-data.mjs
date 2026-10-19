// Painel do CampoData aberto no caderno (item 63, passo 4). Servidor em 3100.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  const erros = []; p.on("pageerror", (e) => erros.push(String(e)));
  await p.goto("http://127.0.0.1:3100/tarefas", { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  await p.getByRole("button", { name: /Ir para o dia/ }).click();
  await p.waitForTimeout(400);
  await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
  await p.screenshot({ path: join(PASTA, `${w}-calendario-aberto.png`) });
  if (w === 1440) {
    await p.getByRole("button", { name: /^quarta-feira, 21 de outubro/i }).click();
    await p.waitForTimeout(1000);
    console.log("dia depois:", await p.locator(".pag-faixa-sub").first().textContent());
  }
  console.log(w, "erros:", erros.length ? erros : "nenhum");
  await p.close();
}
await nav.close();
