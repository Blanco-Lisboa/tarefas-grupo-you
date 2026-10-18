// Rodada 4: limpar a data e escolher outra depois do fim antigo leva o fim junto. Rodar: node provas/sextante/capturar-rodada4.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const erros = [];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 760 } });
p.on("pageerror", (e) => erros.push(e.message));
p.on("console", (m) => m.type() === "error" && !m.text().includes("WebSocket") && erros.push(m.text()));
await p.goto("http://localhost:3100/calendario", { waitUntil: "networkidle" });
await p.evaluate(() => console.error("ERRO DE PROPOSITO"));
await p.locator(".evento-bloco", { hasText: "Reuni" }).first().click(); // 19/10 09:00 às 09:45
const d = p.locator("dialog.ficha[open]");
await d.getByLabel("Data", { exact: true }).fill("");
await d.getByLabel("Data", { exact: true }).fill("2026-10-25");
const fim = [await d.getByLabel("Começa").inputValue(), await d.getByLabel("Termina", { exact: true }).inputValue(), await d.getByLabel("Termina no dia").inputValue()];
await p.evaluate(() => { const s = document.createElement("div"); s.textContent = `innerWidth ${innerWidth}`; s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px"; document.body.append(s); });
await p.screenshot({ path: join(PASTA, "r4-1440-limpa-e-troca-data.png") });
await d.getByRole("button", { name: "Salvar" }).click();
await p.getByRole("button", { name: "Próximo" }).click();
const salvo = await p.locator(".evento", { hasText: "Reuni" }).first().getAttribute("title");
console.log(JSON.stringify({ fim, salvo, erros }, null, 1));
await b.close();
