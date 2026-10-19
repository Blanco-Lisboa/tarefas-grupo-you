// Prova da paleta de etiquetas na Névoa (Sextante): antes x depois lado a lado (paleta antiga lida do git) e o calendário
// em 1440 (mês e semana). Servidor em 3100 ligado. Chrome headless, nunca usa o mouse/teclado de verdade.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

const PASTA = fileURLToPath(new URL("./", import.meta.url));
const RAIZ = fileURLToPath(new URL("../../", import.meta.url));
const ler = (css) => Array.from({ length: 10 }, (_, i) => {
  const n = i + 1;
  const linha = css.split("\n").find((l) => l.includes(`--etiqueta-${n}:`));
  const [, fundo, letra, nome] = linha.match(/(#\w{6}).*?(#\w{6}).*?\/\* (.*?) ·/);
  return { n, fundo, letra, nome };
});
const antes = ler(execSync("git show 48f5d79:src/styles/etiquetas.css", { cwd: RAIZ, encoding: "utf8" }));
const depois = ler(readFileSync(join(RAIZ, "src/styles/etiquetas.css"), "utf8"));

const coluna = (titulo, lista) => `<section><h2>${titulo}</h2>${lista.map((c) =>
  `<div class="e" style="background:${c.fundo};color:${c.letra}"><b>${c.n}</b> ${c.nome}<span>${c.fundo}</span></div>`).join("")}</section>`;
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:32px;background:#E8E9EC;font:14px Inter,system-ui,sans-serif;color:#1D1D1F;display:flex;gap:32px}
section{flex:1;background:#fff;border-radius:16px;padding:20px;box-shadow:0 1px 2px rgb(0 0 0/.06),0 8px 24px -12px rgb(0 0 0/.18)}
h2{margin:0 0 12px;font-size:20px;font-weight:600;letter-spacing:-.03em}
.e{display:flex;gap:8px;align-items:center;padding:10px 12px;margin:6px 0;border-radius:6px;font-weight:600}
.e span{margin-left:auto;font:500 12px monospace;opacity:.85}</style>
${coluna("Antes (Beec)", antes)}${coluna("Depois (Névoa)", depois)}`;

const b = await chromium.launch();
const erros = [];
const p1 = await b.newPage({ viewport: { width: 900, height: 600 } });
await p1.setContent(html);
await p1.screenshot({ path: join(PASTA, "antes-depois.png"), fullPage: true });

const p = await b.newPage({ viewport: { width: 1440, height: 760 } });
p.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
await p.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
await p.locator(".cal-painel").waitFor();
const cor = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--etiqueta-1").trim());
if (cor.toUpperCase() !== depois[0].fundo) erros.push(`servidor ainda com a paleta velha (${cor})`);
await p.evaluate(() => {
  const s = document.createElement("div");
  s.textContent = `innerWidth ${innerWidth}`;
  s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#000;color:#fff;font:700 13px monospace;padding:3px 8px;pointer-events:none";
  document.body.append(s);
});
await p.screenshot({ path: join(PASTA, "1440-semana.png") });
await p.keyboard.press("m");
await p.waitForTimeout(300);
await p.screenshot({ path: join(PASTA, "1440-mes.png") });
await b.close();
console.log(erros.length ? erros.join("\n") : "sem erros");
