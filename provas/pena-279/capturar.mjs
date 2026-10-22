// Prova do item 279: tarefa às 08:00 na cópia de exemplo (3101) com a reunião das 10:00 pela frente; o menu ⋮ Duração lista 30 min a 6h e apaga o que não cabe.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://127.0.0.1:3201/entrar");
  await p.goto("http://127.0.0.1:3101/tarefas", { waitUntil: "networkidle" });
  await p.waitForSelector(".folha-linhas");
  if (!(await p.locator(".linha", { hasText: "Ler o briefing" }).count())) {
    const campo = p.getByLabel("Nova tarefa, 08:00").first();
    await campo.fill("Ler o briefing"); await campo.press("Enter");
  }
  const linha = p.locator(".linha", { hasText: "Ler o briefing" }).first();
  await linha.hover();
  await linha.getByRole("button", { name: /Mais opções/ }).click();
  await p.getByRole("button", { name: /^Duração/ }).click();
  await p.waitForTimeout(400);
  const itens = await p.locator(".mt-duracoes .selecao-opcao").evaluateAll((a) => a.map((e) => `${e.textContent}${e.disabled ? " [apagada]" : ""}`));
  console.log(w, itens.join(" | "));
  await p.evaluate(() => { const s = document.createElement("div"); s.textContent = `innerWidth ${innerWidth}`; s.style.cssText = "position:fixed;left:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px"; document.body.append(s); });
  await p.screenshot({ path: join(PASTA, `${w}-duracao-6h.png`) });
  await p.close();
}
await nav.close();
