// Prova do 293: mede a mesma tarefa no Dia e no Sem data (caixa, título, ⋮, linha azul, altura da linha, largura da página) e fotografa os dois.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const p = await nav.newPage({ viewport: { width: 1903, height: 900 } });
await p.goto("http://127.0.0.1:3201/entrar");
await p.goto("http://127.0.0.1:3101/tarefas", { waitUntil: "networkidle" });
const medir = () => p.evaluate(() => {
  const pag = document.querySelector(".pag").getBoundingClientRect(), li = [...document.querySelectorAll(".linha")].find((l) => l.querySelector(".abrir")), r = (s) => li.querySelector(s)?.getBoundingClientRect();
  const f = (x) => +x.toFixed(1);
  return { largPagina: f(pag.width), alturaLinha: f(li.getBoundingClientRect().height), horaAteLinhaAzul: f(li.querySelector(".linha-hora").getBoundingClientRect().width), caixaDaBorda: f(r(".caixa").left - pag.left), tituloDaBorda: f(r(".abrir").left - pag.left), pontosDaDireita: f(pag.right - r(".mt-pontos").right) };
});
await p.waitForSelector(".folha-linhas"); await p.waitForTimeout(800);
console.log("Dia     ", JSON.stringify(await medir()));
await p.screenshot({ path: join(PASTA, "dia-1903.png") });
await p.getByRole("button", { name: "Sem data", exact: true }).click(); await p.waitForTimeout(800);
console.log("Sem data", JSON.stringify(await medir()));
await p.screenshot({ path: join(PASTA, "semdata-1903.png") });
await nav.close();
