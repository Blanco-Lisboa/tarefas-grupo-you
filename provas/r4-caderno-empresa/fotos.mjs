import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const SAIDA = fileURLToPath(new URL("../../docs/referencias/2026-10-19-rodada-4/", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  const tag = () => p.evaluate(() => { const d = document.createElement("div"); d.id = "iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff;font:700 12px monospace;padding:4px 8px"; document.getElementById("iw")?.remove(); document.body.append(d); });
  const foto = async (n) => { await p.waitForTimeout(400); await tag(); await p.screenshot({ path: join(SAIDA, `91-${n}-${w}.png`) }); };
  await p.goto("http://localhost:3100/tarefas", { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  if (w < 500) await p.getByRole("button", { name: "Caderno", exact: true }).click().catch(() => {});
  const escrever = async (t) => { const c = p.locator("input.campo").first(); await c.fill(t); await c.press("Enter"); await p.waitForTimeout(300); };
  // 1) tarefa com empresa (padrão) e 2) tarefa sem empresa (Nenhuma)
  await escrever("Tarefa da Beec com logo");
  await p.locator(".folha-quem .selecao-botao").first().click();
  await foto("lista-nenhuma");
  await p.locator(".folha-quem .selecao-opcao", { hasText: "Nenhuma" }).click();
  await escrever("Anotação sem empresa");
  await foto("dia-linhas");
  // 3) trocar pelo ⋮: a de Beec vira Nenhuma
  await p.getByRole("button", { name: /Mais opções: Tarefa da Beec/ }).click();
  await p.getByRole("button", { name: "Mudar empresa…" }).click();
  await foto("menu-empresa");
  await p.locator(".mt-pop:popover-open .selecao-opcao", { hasText: "Nenhuma" }).click();
  await p.waitForTimeout(300);
  await p.getByRole("button", { name: /Mais opções: Anotação/ }).click();
  await p.getByRole("button", { name: "Mudar empresa…" }).click();
  await p.locator(".mt-pop:popover-open .selecao-opcao").nth(1).click(); // 1ª empresa
  await foto("trocou");
  // 4) Sem data
  await p.getByRole("button", { name: "Sem data", exact: true }).click();
  await p.waitForTimeout(600);
  await escrever("Sem data com logo");
  await p.locator(".folha-quem .selecao-botao").first().click();
  await p.locator(".folha-quem .selecao-opcao", { hasText: "Nenhuma" }).click();
  await escrever("Sem data sem empresa");
  await foto("semdata");
  await p.close();
}
await nav.close();
