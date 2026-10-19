import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ channel: "chrome", args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/conteudos", { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  const col = p.locator('[data-etapa="roteiro"]');
  const antes = await col.locator(".conteudos-titulo").allTextContents();
  await col.locator(".conteudos-novo").click();
  const titulo = `Card novo ${w}`;
  await p.getByLabel("Título", { exact: true }).fill(titulo);
  const salvar = p.getByRole("button", { name: "Salvar" });
  if (await salvar.isDisabled()) console.log("Salvar travado: falta empresa?");
  await salvar.click();
  await p.waitForTimeout(600);
  const depois = await col.locator(".conteudos-titulo").allTextContents();
  console.log(w, "primeiro:", depois[0], "| antes:", antes.length, "depois:", depois.length, "| topo ok:", depois[0] === titulo);
  await col.scrollIntoViewIfNeeded();
  await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
  await p.screenshot({ path: join(PASTA, `100-card-no-topo-${w}.png`) });
  await p.close();
}
await nav.close();
