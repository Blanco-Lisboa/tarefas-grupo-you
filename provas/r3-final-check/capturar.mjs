// Conferência final (rodada 3). Servidor em 3100: node provas/r3-final-check/capturar.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const TELAS = ["calendario", "mapa", "tarefas", "conteudos", "pastas", "configuracoes"];
const nav = await chromium.launch({ headless: true });
const resumo = [];
const marcar = (p, extra = "") => p.evaluate((extra) => {
  document.getElementById("__marca")?.remove();
  const s = document.createElement("div"); s.id = "__marca";
  const d = document.documentElement;
  s.textContent = `innerWidth ${innerWidth} · scrollWidth ${d.scrollWidth} / clientWidth ${d.clientWidth}${extra}`;
  s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#1D1D1F;color:#fff;font:700 12px monospace;padding:3px 8px;pointer-events:none";
  document.body.append(s);
  return [d.scrollWidth, d.clientWidth];
}, extra);
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const c = await nav.newContext({ viewport: { width: w, height: h } });
  const p = await c.newPage();
  let tela = "?"; const logs = [];
  p.on("console", (m) => ["error", "warning"].includes(m.type()) && logs.push(`[${tela}] ${m.type()}: ${m.text().slice(0, 200)}`));
  p.on("pageerror", (e) => logs.push(`[${tela}] pageerror: ${e.message.slice(0, 200)}`));
  p.on("response", (r) => r.status() >= 400 && logs.push(`[${tela}] HTTP ${r.status()} ${r.url()}`));
  // prova de que a captura funciona
  tela = "TESTE"; await p.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
  await p.evaluate(() => { console.error("erro provocado"); setTimeout(() => { throw new Error("pageerror provocado"); }); });
  await p.waitForTimeout(300);
  const prova = logs.length; console.log(`[${w}] captura provada: ${prova} entradas`, logs.splice(0));
  for (const t of TELAS) {
    tela = t;
    await p.goto(`http://127.0.0.1:3100/${t}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(t === "pastas" ? 2500 : 1000);
    const [sw, cw] = await marcar(p);
    resumo.push(`${w} ${t}: scrollWidth ${sw} / clientWidth ${cw}${sw > cw ? "  <-- ROLA" : ""}`);
    await p.screenshot({ path: join(PASTA, `${w}-${t}.png`), fullPage: true });
  }
  tela = "ficha";
  await p.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  const ev = p.locator("button.evento:visible").first();
  if (await ev.count()) { await ev.scrollIntoViewIfNeeded(); await ev.click(); await p.waitForTimeout(800); }
  else console.log(`[${w}] sem evento para abrir a ficha`);
  const [sw, cw] = await marcar(p, " · ficha aberta");
  resumo.push(`${w} ficha: scrollWidth ${sw} / clientWidth ${cw}, dialog aberto: ${await p.locator("dialog[open]").count()}`);
  await p.screenshot({ path: join(PASTA, `${w}-ficha.png`) });
  console.log(logs.length ? logs.join("\n") : `[${w}] console: nenhum erro/aviso`);
  await c.close();
}
console.log(resumo.join("\n"));
await nav.close();
