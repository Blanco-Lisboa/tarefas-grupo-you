// Console limpo em /mapa e /conteudos, com e sem a extensão de tradução simulada. Dev em 3100: node provas/r6-console/console.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const BASE = "http://127.0.0.1:3100";
const nav = await chromium.launch({ headless: true });
for (const traducao of [false, true]) {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 760 } });
  if (traducao) await ctx.addInitScript(() => {
    // imita a extensão: mexe nas classes do <html> e <body> antes do React hidratar
    const marca = () => { document.documentElement?.classList.add("translated-ltr"); document.body?.classList.add("translator-hidden", "translate-tooltip-mobile"); };
    new MutationObserver(marca).observe(document, { childList: true, subtree: true });
    marca();
  });
  const p = await ctx.newPage();
  let erros = [];
  p.on("console", (m) => ["error", "warning"].includes(m.type()) && erros.push(`${m.type()}: ${m.text().slice(0, 200)}`));
  p.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.evaluate(() => console.error("TESTE-INSTRUMENTO"));
  await p.waitForTimeout(300);
  console.log(traducao ? "[com extensão simulada]" : "[normal]", "instrumento captura:", erros.some((e) => e.includes("TESTE-INSTRUMENTO")));
  for (const rota of ["/mapa", "/conteudos"]) {
    erros = [];
    await p.goto(BASE + rota, { waitUntil: "networkidle" });
    await p.waitForTimeout(2500);
    console.log(rota, erros.length ? erros : "console limpo");
  }
  await ctx.close();
}
await nav.close();
