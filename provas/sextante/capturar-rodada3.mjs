// Rodada 3: fim anda junto com o início; empresa obrigatória. Rodar: node provas/sextante/capturar-rodada3.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const BASE = "http://localhost:3100";
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const erros = [];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 760 } });
p.on("pageerror", (e) => erros.push(e.message));
p.on("console", (m) => m.type() === "error" && !m.text().includes("WebSocket") && erros.push(m.text()));
const marcar = () => p.evaluate(() => { const s = document.createElement("div"); s.textContent = `innerWidth ${innerWidth}`; s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#18131F;color:#FFBF2F;font:700 13px monospace;padding:3px 8px"; document.body.append(s); });

await p.goto(BASE + "/calendario", { waitUntil: "networkidle" });
await p.evaluate(() => console.error("ERRO DE PROPOSITO"));
await p.locator(".evento-bloco", { hasText: "Reuni" }).first().click();
const d = p.locator("dialog.ficha[open]");
await d.getByLabel("Começa").fill("14:00");
await d.getByLabel("Data", { exact: true }).fill("2026-10-20");
const fim = [await d.getByLabel("Termina", { exact: true }).inputValue(), await d.getByLabel("Termina no dia").inputValue()];
await marcar();
await p.screenshot({ path: join(PASTA, "r3-1440-fim-anda-junto.png") });
await d.getByRole("button", { name: "Salvar" }).click();
const salvo = await p.locator(".evento", { hasText: "Reuni" }).first().getAttribute("title");

await p.goto(BASE + "/configuracoes", { waitUntil: "networkidle" });
for (let i = 0; i < 2; i++) {
  await p.getByRole("button", { name: "Tirar", exact: true }).first().click();
  await p.getByRole("button", { name: "Sim, tirar empresa" }).click();
}
await p.getByRole("link", { name: "Calendário" }).click();
await p.getByRole("button", { name: "+ Nova tarefa" }).click();
await d.locator(".ficha-titulo").fill("Sem empresa");
const aviso = await d.locator(".ficha-aviso").textContent();
const travado = await d.getByRole("button", { name: "Salvar" }).isDisabled();
await marcar();
await p.screenshot({ path: join(PASTA, "r3-1440-sem-empresa.png") });
await d.getByRole("link", { name: "Cadastrar em Configurações" }).click();
await p.waitForURL("**/configuracoes");
console.log(JSON.stringify({ fim, salvo, aviso, travado, foiPara: new URL(p.url()).pathname, erros }, null, 1));
await b.close();
