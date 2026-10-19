// Fotos da Etapa 1 (login). Servidor de produção em 3120 (next start). Chrome sem janela, nada de mouse/teclado do Natham.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const marca = (p) => p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth + " | " + location.pathname; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
for (const [w, h] of [[1903, 910], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  const erros = [];
  p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  p.on("pageerror", (e) => erros.push(String(e)));
  await p.goto("http://localhost:3120/entrar", { waitUntil: "networkidle" });
  await marca(p);
  await p.screenshot({ path: join(PASTA, `entrar-${w}.png`) });
  // porteiro: quem não entrou e abre uma tela do app vai parar em /entrar
  await p.goto("http://localhost:3120/calendario", { waitUntil: "networkidle" });
  console.log(w, "abriu /calendario sem login e parou em:", new URL(p.url()).pathname);
  await p.evaluate(() => document.querySelectorAll("div[style*='z-index:99999']").forEach((e) => e.remove()));
  await marca(p);
  await p.screenshot({ path: join(PASTA, `porteiro-${w}.png`) });
  // senha errada: o aviso aparece
  await p.fill("input[name=email]", "teste@exemplo.com");
  await p.fill("input[name=senha]", "senha-errada");
  await p.click("button[type=submit]");
  await p.waitForSelector(".entrar-erro", { timeout: 15000 });
  console.log(w, "senha errada ->", await p.textContent(".entrar-erro"));
  await p.screenshot({ path: join(PASTA, `entrar-erro-${w}.png`) });
  console.log(w, "scroll horizontal:", await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth));
  console.log(w, "erros de console:", erros.length ? erros : "nenhum");
  await p.close();
}
await nav.close();
