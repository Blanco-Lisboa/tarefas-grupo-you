// Prova do item 116: o que a Fila mostra no dia aparece na folha do mesmo dia do Caderno, na mesma ordem.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const etiqueta = (p) => p.evaluate(() => { document.getElementById("iw")?.remove(); const d = document.createElement("div"); d.id = "iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" });
  await p.evaluate(() => localStorage.setItem("grade:mapa-formato", "fila"));
  await p.reload({ waitUntil: "networkidle" });
  for (const topo of await p.locator(".eo-dia-topo").all()) if (await topo.getAttribute("aria-expanded") === "false") await topo.click();
  const fila = await p.evaluate(() => [...document.querySelectorAll(".eo-dia")].slice(0, 3).map((d) => [d.querySelector(".eo-dia-data").textContent, [...d.querySelectorAll(".eo-linha")].map((l) => l.querySelector(".eo-titulo").textContent + " @" + l.querySelector(".eo-prazo").textContent)]));
  await p.goto("http://localhost:3100/tarefas", { waitUntil: "networkidle" }); await p.waitForTimeout(500);
  const ler = () => p.evaluate(() => [...document.querySelectorAll(".livro .pag")][0]?.innerText.replace(/\n+/g, " | ").slice(0, 600));
  const out = { w, fila, hoje: await ler() };
  await etiqueta(p); await p.screenshot({ path: join(PASTA, `77-caderno-hoje-${w}.png`) });
  await p.getByRole("button", { name: "Próximo dia" }).click(); await p.waitForTimeout(1500);
  out.amanha = await ler();
  await etiqueta(p); await p.screenshot({ path: join(PASTA, `77-caderno-amanha-${w}.png`) });
  console.log(JSON.stringify(out, null, 1));
  await p.close();
}
await nav.close();
