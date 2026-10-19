// Fotos dos 3 protótipos da tela de Entrar (item 149). Chrome fora da tela. Uso: node provas/r6-login-opcoes/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const PROTO = join(PASTA, "../../prototipos/login");
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const marca = (p) => p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
for (const n of [1, 2, 3]) for (const [w, h] of [[1903, 910], [1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto(pathToFileURL(join(PROTO, `opcao-${n}/index.html`)).href, { waitUntil: "networkidle" });
  await marca(p);
  await p.waitForTimeout(2000); // entrada animada + a opção 3 redesenha 72 linhas por quadro: espera o quadro com a etiqueta
  await p.screenshot({ path: join(PASTA, `opcao-${n}-${w}.png`), fullPage: true });
  if (w === 1903) { await p.locator("input").first().focus(); await p.locator("input").first().fill("natham@youcontabilidade.com"); await p.waitForTimeout(300); await p.screenshot({ path: join(PASTA, `opcao-${n}-${w}-foco.png`) }); }
  await p.close();
}
await nav.close();
