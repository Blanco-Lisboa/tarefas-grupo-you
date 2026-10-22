import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1440, 760], [390, 800]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://127.0.0.1:3201/entrar", { waitUntil: "networkidle" }); await p.waitForTimeout(1500);
  await p.goto("http://127.0.0.1:3101/conteudos", { waitUntil: "networkidle" }); await p.waitForTimeout(1500);
  // cria um card de conteúdo SEM data na Esteira
  await p.locator("button[aria-label^='Novo conteúdo em']").first().click();
  await p.locator("dialog.ficha textarea.ficha-titulo").fill("Card da Esteira sem data (287)");
  await p.locator("dialog.ficha button[type=submit]").click();
  await p.locator("dialog.ficha[open]").waitFor({ state: "detached", timeout: 15000 });
  await p.locator("a[href='/tarefas']").first().click();
  await p.locator("button.tarefas-botao").first().waitFor();
  await p.locator("button.tarefas-botao:has-text(\"Sem data\")").click();
  await p.waitForTimeout(1200);
  await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;top:8px;z-index:99999;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
  console.log(w, "onde aparece o texto:", await p.evaluate(() => [...document.querySelectorAll("*")].filter((e) => e.children.length === 0 && e.textContent.includes("Card da Esteira sem data")).map((e) => e.tagName + "." + e.className + " < " + e.parentElement.className)));
  await p.screenshot({ path: `${PASTA}287-sem-data-${w}.png` });
  await p.close();
}
await nav.close();
