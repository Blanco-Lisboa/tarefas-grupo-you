// Fotos do item 98 (logos de empresa e ícones de rede). Servidor em 3100 ligado. Chrome sem janela.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  const erros = [];
  p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  p.on("pageerror", (e) => erros.push(String(e)));
  for (const [nome, url] of [["calendario", "/calendario"], ["caderno", "/tarefas"], ["pastas", "/pastas"]]) {
    await p.goto("http://localhost:3100" + url, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: join(PASTA, `${nome}-${w}.png`) });
    console.log(w, nome, "logos:", await p.locator("img.marca-logo").count(), "redes:", await p.locator("img.marca-rede").count());
  }
  await p.goto("http://localhost:3100/calendario", { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  const ev = p.locator(".evento:visible").first();
  if (await ev.count()) {
    await ev.click();
    await p.waitForTimeout(800);
    await p.locator("dialog[open] .selecao-botao").nth(2).click().catch(() => {});
    await p.waitForTimeout(500);
    await p.screenshot({ path: join(PASTA, `ficha-rede-${w}.png`) });
    await p.keyboard.press("Escape");
    await p.locator("dialog[open] .selecao-botao").nth(1).click().catch(() => {});
    await p.waitForTimeout(500);
    await p.screenshot({ path: join(PASTA, `ficha-empresa-${w}.png`) });
  }
  console.log(w, "overflow:", await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), "erros:", erros.length ? erros : "nenhum");
  await p.close();
}
await nav.close();
