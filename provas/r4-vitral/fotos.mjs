import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const marca = (p) => p.evaluate(() => { document.getElementById("iw")?.remove(); const d = document.createElement("div"); d.id = "iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:absolute;left:8px;bottom:8px;z-index:2147483647;background:#fff;font:700 12px monospace;padding:4px 8px"; (document.querySelector("dialog[open]") ?? document.body).append(d); });
const foto = async (p, nome, w) => { await p.waitForTimeout(900); await marca(p); await p.screenshot({ path: join(PASTA, `${nome}-${w}.png`) }); };
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  const erros = []; p.on("pageerror", (e) => erros.push(e.message)); p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  await p.goto("http://localhost:3100/pastas", { waitUntil: "networkidle" });
  await p.evaluate(() => localStorage.removeItem("grade-conteudo:ideias:v1"));
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(3500);
  await foto(p, "1-pastas-fechadas", w);
  // pasta aberta (Posts da Beec)
  await p.locator(".gf-hit").first().click();
  await foto(p, "2-pasta-aberta", w);
  // card da peça
  await p.locator(".gf-root[data-open] .gf-sheet").last().click({ force: true });
  await p.waitForSelector("dialog[open]");
  await foto(p, "3-card-peca", w);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(400);
  console.log(w, "esc fecha:", await p.locator("dialog[open]").count() === 0);
  // ideias: abrir a pasta da Beec
  await p.locator(".gf-hit", { has: p.locator("xpath=..") }).nth(4).click();
  await p.waitForTimeout(800);
  await p.locator(".gf-root[data-open] .gf-sheet").last().click({ force: true });
  await p.waitForSelector("dialog[open]");
  await foto(p, "4-ideias-categoria", w);
  await p.getByRole("button", { name: "Voltar" }).click();
  await foto(p, "4b-ideias-categorias", w);
  await p.locator(".ideias-cats button").first().click();
  await p.locator(".ideias-lista button").first().click();
  await foto(p, "5-ideia-aberta", w);
  await p.getByRole("button", { name: "Editar" }).click();
  await foto(p, "6-editar-ideia", w);
  await p.getByRole("button", { name: "Voltar" }).click();
  await p.getByRole("button", { name: "Voltar" }).click();
  await p.getByRole("button", { name: "Voltar" }).click();
  await p.getByRole("button", { name: "+ Ideia" }).click();
  await p.locator("input[name=titulo]").fill("Bastidores do fechamento do mês");
  await p.locator("textarea[name=texto]").fill("Mostrar a equipe conferindo as notas antes do prazo.");
  await p.locator("input[name=link]").fill("https://www.instagram.com/explore/");
  await foto(p, "7-formulario-adicionar", w);
  await p.getByRole("button", { name: "+ Ideia" }).click();
  await p.waitForTimeout(500);
  await foto(p, "8-ideia-adicionada", w);
  console.log(w, "salvo no navegador:", (await p.evaluate(() => localStorage.getItem("grade-conteudo:ideias:v1"))).includes("Bastidores do fechamento"));
  // clique fora fecha
  await p.mouse.click(4, h - 4);
  await p.waitForTimeout(400);
  console.log(w, "clique fora fecha:", await p.locator("dialog[open]").count() === 0, "erros:", erros);
  await p.close();
}
await nav.close();
