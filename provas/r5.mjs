import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const marca = (p) => p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
const p = await nav.newPage({ viewport: { width: 1440, height: 760 } });
await p.goto("http://localhost:3100/tarefas", { waitUntil: "networkidle" });
await p.getByRole("button", { name: "Sem data" }).click();
await p.waitForTimeout(800);
const medir = () => p.evaluate(() => {
  const ls = [...document.querySelectorAll(".folha-linhas")];
  const tops = ls.map((u) => [...u.children].map((li) => Math.round(li.getBoundingClientRect().top * 100) / 100));
  const alt = ls.map((u) => [...u.children].map((li) => li.getBoundingClientRect().height));
  return { n: tops.map((t) => t.length), t0: tops.map((t) => t[0]), diffTops: tops[1] ? tops[0].map((v, i) => +(v - tops[1][i]).toFixed(2)).filter((d) => d !== 0).slice(0, 5) : null, alturasDistintas: [...new Set(alt.flat())] };
});
console.log("semdata", JSON.stringify(await medir()));
await marca(p);
await p.screenshot({ path: join(PASTA, "r5/52-sem-data-1440.png") });
// Dia: etiqueta
await p.getByRole("button", { name: "Dia", exact: true }).click();
await p.waitForTimeout(500);
const pontos = p.locator(".mt-pontos").first();
await pontos.click({ force: true });
await p.getByRole("button", { name: "Prioridade", exact: true }).click();
await p.waitForTimeout(400);
console.log("chip na hora:", await p.locator(".linha-etq").allTextContents());
await p.getByRole("button", { name: "Próximo" }).click(); await p.waitForTimeout(700);
await p.getByRole("button", { name: "Anterior" }).click(); await p.waitForTimeout(900);
console.log("chip depois de voltar:", await p.locator(".linha-etq").allTextContents());
console.log("cor chip:", await p.locator(".linha-etq").first().evaluate((e) => getComputedStyle(e).backgroundColor));
await marca(p);
await p.screenshot({ path: join(PASTA, "r5/52-etiqueta-1440-v2.png") });
await p.locator(".mt-pontos").first().click({ force: true });
await p.waitForTimeout(300);
await p.screenshot({ path: join(PASTA, "r5/52-etiqueta-menu-1440.png") });
for (const rota of ["mapa"]) for (const [w, h] of [[1440, 760], [390, 844]]) {
  const q = await nav.newPage({ viewport: { width: w, height: h } });
  await q.goto("http://localhost:3100/" + rota, { waitUntil: "networkidle" });
  await q.waitForTimeout(2000);
  await marca(q);
  await q.screenshot({ path: join(PASTA, `r5/52-${rota}-${w}.png`) });
}
await nav.close();
