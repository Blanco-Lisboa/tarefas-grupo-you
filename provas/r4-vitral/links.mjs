import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/pastas", { waitUntil: "networkidle" });
  await p.waitForTimeout(3000);
  const marca = () => p.evaluate(() => { document.getElementById("iw")?.remove(); const d = document.createElement("div"); d.id = "iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:absolute;left:8px;bottom:-30px;z-index:99999;background:#fff;font:700 12px monospace;padding:4px 8px"; (document.querySelector("dialog[open]") ?? document.body).append(d); });
  const foto = async (n) => { await p.waitForTimeout(700); await marca(); await p.screenshot({ path: join(PASTA, `${n}-${w}.png`) }); };
  const ideias = p.locator(".pastas-empresa").first().locator(".gf-hit").nth(4);
  await ideias.scrollIntoViewIfNeeded(); await ideias.click(); await p.waitForTimeout(900);
  await p.locator(".gf-root[data-open] .gf-sheet").last().click({ force: true });
  await p.waitForSelector("dialog[open]");
  // ideia nova com o link colado no texto (como a foto 18 do Natham), na categoria Ganchos
  await p.getByRole("button", { name: "Voltar" }).click();
  await p.getByRole("button", { name: "+ Ideia" }).click();
  await p.locator("input[name=titulo]").fill("Ideias de ganchos + Exemplos");
  await p.locator("textarea[name=texto]").fill("1) Ideias de ganchos + Exemplos\nhttps://www.instagram.com/p/DbVxdacAyL7/");
  await p.locator("dialog .selecao-botao").click(); await p.getByRole("option", { name: /Ganchos/ }).or(p.locator(".selecao-opcao", { hasText: "Ganchos" })).first().click();
  await p.getByRole("button", { name: "+ Ideia" }).click();
  await p.waitForTimeout(500);
  await foto("13-ideia-link-ver-referencia");
  const a = p.locator(".ideia-texto a");
  console.log(w, "link:", await a.getAttribute("href"), await a.getAttribute("target"), await a.getAttribute("rel"), "texto:", await a.innerText(), "cor:", await a.evaluate((e) => getComputedStyle(e).color), "cru na tela:", (await p.locator(".ideia-texto").innerText()).includes("https://"));
  // quinta categoria => "Ver todas" na pasta de ideias
  await p.getByRole("button", { name: "Voltar" }).click(); await p.getByRole("button", { name: "Voltar" }).click();
  await p.getByRole("button", { name: "+ Ideia" }).click();
  await p.locator("input[name=titulo]").fill("Trend da semana");
  await p.locator("dialog .selecao-botao").click(); await p.locator(".selecao-opcao", { hasText: "Nova categoria" }).click();
  await p.locator("input[required]").last().fill("Trends");
  await p.getByRole("button", { name: "+ Ideia" }).click();
  await p.waitForTimeout(400);
  await p.keyboard.press("Escape"); await p.waitForTimeout(600);
  await p.mouse.click(w - 4, 4); await p.waitForTimeout(500);
  const todas = p.locator(".pastas-empresa").first().locator(".gf-todas").filter({ hasText: /Ver todas \(5\)/ });
  console.log(w, "Ver todas na pasta de ideias:", await todas.count(), "botões Ver todas na tela:", await p.locator(".gf-todas").allInnerTexts());
  await todas.scrollIntoViewIfNeeded(); await todas.click();
  await foto("14-ver-todas-pasta-ideias");
  await p.close();
}
await nav.close();
