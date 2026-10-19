// Fotos e medidas do Mapa (itens 113 a 117) e do Caderno (116). Uso: node fotos.mjs  (servidor em localhost:3100)
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const etiqueta = (p) => p.evaluate(() => { document.getElementById("iw")?.remove(); const d = document.createElement("div"); d.id = "iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
const caixa = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom) }; }, sel);
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  const erros = []; p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  await p.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" });
  await p.evaluate(() => localStorage.removeItem("grade:mapa-formato"));
  await p.reload({ waitUntil: "networkidle" }); await p.waitForTimeout(800);
  const m = {};
  const medir = async (nome) => { m[nome] = { abas: await caixa(p, ".mapa-formato"), titulo: await caixa(p, ".mapa-titulo"), resumo: await caixa(p, ".mapa-resumo"), azul: await caixa(p, ".bloco-destaque"), lista: await caixa(p, ".eo-fila") ?? await caixa(p, ".mapa-cartao"), pagina: await p.evaluate(() => document.documentElement.scrollWidth) }; };
  await etiqueta(p); await medir("linha"); await p.screenshot({ path: join(PASTA, `77-mapa-linha-${w}.png`) });
  await p.getByRole("button", { name: "Fila", exact: true }).click(); await p.waitForTimeout(500);
  await etiqueta(p); await medir("fila-hoje"); await p.screenshot({ path: join(PASTA, `77-fila-hoje-v3-${w}.png`) });
  // lembrado ao recarregar
  await p.reload({ waitUntil: "networkidle" }); await p.waitForTimeout(500);
  m.lembrou = await p.evaluate(() => document.querySelector(".mapa-formato [aria-pressed=true]")?.textContent);
  m.formatos = await p.evaluate(() => [...document.querySelectorAll(".mapa-formato button")].map((b) => b.textContent));
  // dia seguinte expandido, por teclado
  const topos = p.locator(".eo-dia-topo");
  m.cards = await topos.count();
  const segundo = topos.nth(1);
  await segundo.focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(300);
  m.expandiuTeclado = await segundo.getAttribute("aria-expanded");
  m.diaExpandido = await p.evaluate(() => document.querySelectorAll(".eo-dia")[1].querySelector(".eo-dia-data").textContent);
  m.hojeAindaAberto = await p.locator(".eo-dia").first().getAttribute("data-aberto");
  m.nomeEmpresaNoTexto = await p.evaluate(() => /Beec|You/.test([...document.querySelectorAll(".eo-linha")].map((l) => l.textContent).join(" ")));
  m.semRolagemLateral = await p.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth);
  await etiqueta(p); await segundo.scrollIntoViewIfNeeded(); await p.screenshot({ path: join(PASTA, `77-fila-dia-expandido-${w}.png`) });
  m.diaFoto = m.diaExpandido;
  m.erros = erros;
  console.log(w, JSON.stringify(m));
  await p.close();
}
await nav.close();
