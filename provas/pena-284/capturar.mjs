// Prova do item 284: folha da direita do Caderno na cópia de exemplo (3101). Anotações do dia grande e rolando por dentro; Para amanhã e Não esquecer no fim.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://127.0.0.1:3201/entrar");
  await p.goto("http://127.0.0.1:3101/tarefas", { waitUntil: "networkidle" });
  await p.waitForSelector(".folha-linhas");
  if (w < 768) await p.getByRole("button", { name: "Agenda", exact: true }).click();
  const notas = p.getByLabel("Anotações do dia");
  await notas.fill(Array.from({ length: 30 }, (_, i) => `${i + 1}) anotação do dia, linha ${i + 1}`).join("\n"));
  await p.waitForTimeout(500);
  const m = await p.evaluate(() => { const t = document.querySelector(".ag-bloco-notas textarea"), a = document.querySelector(".agenda .pag-miolo"); return { folhaRola: a.scrollHeight > a.clientHeight, campoRola: t.scrollHeight > t.clientHeight, campoAltura: t.clientHeight, innerWidth }; });
  console.log(w, JSON.stringify(m));
  await p.evaluate(() => { const s = document.createElement("div"); s.textContent = `innerWidth ${innerWidth}`; s.style.cssText = "position:fixed;left:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px"; document.body.append(s); });
  await p.screenshot({ path: join(PASTA, `${w}-anotacoes.png`) });
  await p.close();
}
await nav.close();
