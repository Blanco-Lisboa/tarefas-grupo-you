import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/tarefas", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const m = await p.evaluate(() => {
    const c = (e) => { const r = e.getBoundingClientRect(); return Math.round((r.top + r.height / 2) * 10) / 10; };
    const q = (s) => [...document.querySelectorAll(".tarefas-barra " + s)];
    const itens = [".tarefas-titulo", ".tarefas-quem button", ".tarefas-nav .tarefas-botao", ".tarefas-nav button:last-child", ".tarefas-contador", ".tarefas-abas .tarefas-botao"].flatMap(q).map((e) => [e.className.split(" ")[0] || e.tagName, c(e)]);
    const t = document.querySelector(".tarefas-tela").getBoundingClientRect();
    const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d);
    return { itens, telaTop: t.top, telaBottom: t.bottom, vh: innerHeight, scrollW: document.documentElement.scrollWidth };
  });
  console.log(w, JSON.stringify(m));
  await p.screenshot({ path: join(PASTA, `99-caderno-topo-${w}.png`) });
}
await nav.close();
