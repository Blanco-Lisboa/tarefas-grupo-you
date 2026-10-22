// Prova do item 292: Sem data com tarefas em linhas não seguidas, arraste, e recarregar. Uso: node capturar.mjs antes|depois (cópia de exemplo 3101 + banco falso 3201)
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const qual = process.argv[2] ?? "depois";
const sufixo = qual === "antes" ? "A" : "D";
const nav = await chromium.launch({ headless: true });
const p = await nav.newPage({ viewport: { width: 1903, height: 900 } });
const abrir = async () => {
  await p.goto("http://127.0.0.1:3201/entrar");
  await p.goto("http://127.0.0.1:3101/tarefas", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Sem data", exact: true }).click();
  await p.waitForSelector(".folha-linhas");
  await p.waitForTimeout(600);
};
const marca = () => p.evaluate(() => { const s = document.createElement("div"); s.textContent = `innerWidth ${innerWidth}`; s.style.cssText = "position:fixed;left:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px"; document.body.append(s); });
await abrir();
// escreve direto em linhas vazias não seguidas (a partir da 8ª linha, para ficar abaixo das tarefas que já existem)
for (const [k, nome] of [[8, `Pagar boleto ${sufixo}`], [12, `Ligar para cliente ${sufixo}`], [16, `Ideia de campanha ${sufixo}`]]) {
  const campo = p.locator(".linha").nth(k).locator("input.campo");
  await campo.fill(nome); await campo.press("Enter"); await p.waitForTimeout(600);
}
if (qual === "depois") { // arrasta "Pagar boleto" da linha 8 para a linha 10
  const li = p.locator(".linha", { hasText: "Pagar boleto D" }).first();
  await li.hover();
  const a = await li.locator(".alca").boundingBox();
  const alvo = await p.locator(".linha").nth(10).boundingBox();
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down();
  await p.mouse.move(a.x + a.width / 2, alvo.y + alvo.height / 2, { steps: 12 }); await p.mouse.up();
  await p.waitForTimeout(800);
}
await marca();
await p.mouse.move(0, 0);
await p.screenshot({ path: join(PASTA, `${qual}-1903.png`) });
await p.reload({ waitUntil: "networkidle" });
await p.getByRole("button", { name: "Sem data", exact: true }).click();
await p.waitForSelector(".folha-linhas"); await p.waitForTimeout(800);
await marca(); await p.mouse.move(0, 0);
await p.screenshot({ path: join(PASTA, `${qual}-1903-recarregado.png`) });
console.log(qual, "linhas ocupadas depois de recarregar:", await p.locator(".linha").evaluateAll((ls) => ls.map((l, k) => (l.querySelector(".abrir") ? `${k}:${l.querySelector(".abrir").textContent}` : null)).filter(Boolean)));
await nav.close();
