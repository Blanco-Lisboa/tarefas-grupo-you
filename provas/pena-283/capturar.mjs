// Prova do item 283: bloco de 1h (16:00) e de 2h (19:00) na cópia de exemplo (3101); o horário da margem fica no traço de cima de cada faixa.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
async function garantir(p, nome, hora, duracao) { // a cópia guarda o que já foi criado: cria só se faltar e dá a duração só se ainda não é bloco
  if (!(await p.locator(".linha", { hasText: nome }).count())) {
    const campo = p.getByLabel(`Nova tarefa, ${hora}`).first();
    await campo.fill(nome); await campo.press("Enter");
  }
  if (await p.locator(".linha[data-bloco]", { hasText: nome }).count()) return;
  const linha = p.locator(".linha", { hasText: nome }).first();
  await linha.hover();
  await linha.getByRole("button", { name: /Mais opções/ }).click();
  await p.getByRole("button", { name: /^Duração/ }).click();
  await p.getByRole("button", { name: duracao, exact: true }).click();
  await p.waitForTimeout(500);
}
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://127.0.0.1:3201/entrar");
  await p.goto("http://127.0.0.1:3101/tarefas", { waitUntil: "networkidle" });
  await p.waitForSelector(".folha-linhas");
  await garantir(p, "Bloco de duas horas", "19:00", "2h");
  await p.locator(".linha[data-bloco]", { hasText: "Bloco de duas horas" }).scrollIntoViewIfNeeded();
  await p.evaluate(() => { const s = document.createElement("div"); s.textContent = `innerWidth ${innerWidth}`; s.style.cssText = "position:fixed;left:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px"; document.body.append(s); });
  await p.locator(".pag-miolo").first().evaluate((e) => e.scrollTo(0, 99999));
  await p.waitForTimeout(300);
  await p.screenshot({ path: join(PASTA, `${w}-bloco-2h.png`) });
  await p.locator(".pag-miolo").first().evaluate((e) => e.scrollTo(0, 330));
  await p.waitForTimeout(300);
  await p.screenshot({ path: join(PASTA, `${w}-bloco-1h.png`) });
  await p.close();
}
await nav.close();
