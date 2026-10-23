import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const p = await nav.newPage({ viewport: { width: 1440, height: 760 } });
p.on("pageerror", (e) => console.log("pageerror", String(e)));
await p.goto("http://127.0.0.1:3201/entrar", { waitUntil: "load" }); await p.waitForTimeout(1000);
await p.goto("http://127.0.0.1:3101/pastas", { waitUntil: "load" }); await p.waitForTimeout(1500);
await p.locator("button:has-text('Ideias de conteúdo'), [aria-label*='Ideias']").first().click().catch(async () => { console.log("sem botão"); });
await p.waitForTimeout(1500);
await p.screenshot({ path: PASTA + "r-mural.png" });
const folha = p.locator("article.mural-folha").first();
for (let n = 1; n <= 4; n++) {
  const mais = folha.locator("button.mural-mais");
  if (await mais.count()) await mais.click();
  const campo = folha.locator("input.mural-link-campo");
  await campo.fill(`https://www.instagram.com/p/NOVO${Date.now()}${n}/`);
  await campo.blur();
  await p.waitForTimeout(800);
  console.log(n, "links na folha:", await folha.locator(".mural-ref").count());
}
await p.screenshot({ path: PASTA + "r-depois.png" });
await nav.close();
