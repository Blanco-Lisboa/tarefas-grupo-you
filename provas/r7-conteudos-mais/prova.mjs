import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const REF = fileURLToPath(new URL("../../docs/referencias/2026-10-19-rodada-4/", import.meta.url));
const TITULO = "Editar vídeos do evento do TikTok";
const nav = await chromium.launch({ channel: "chrome", args: ["--window-position=-3000,0"] });
for (const [w, h, mobile] of [[1440, 760, false], [390, 844, true]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h }, hasTouch: mobile });
  const marca = () => p.evaluate(() => { const d = document.getElementById("iw") ?? document.body.appendChild(Object.assign(document.createElement("div"), { id: "iw" })); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff;font:700 12px monospace;padding:4px 8px"; });
  await p.goto("http://localhost:3100/conteudos", { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  const mais = p.getByRole("button", { name: "Novo conteúdo em Edição" });
  const col = p.locator('[data-etapa="edicao"]');
  const antes = await col.locator(".conteudos-cartao").count();
  console.log(w, "botões +", await p.locator(".conteudos-novo").count());
  await mais.scrollIntoViewIfNeeded();
  await marca();
  await p.screenshot({ path: join(REF, `79-coluna-com-mais-${w}.png`) });
  await mais.click();
  await p.waitForTimeout(500);
  await p.locator("textarea.ficha-titulo").pressSequentially(TITULO, { delay: 15 });
  await marca();
  
  await p.screenshot({ path: join(REF, `79-ficha-etapa-edicao-${w}.png`) });
  await p.locator("textarea.ficha-titulo").press("Enter");
  await p.waitForTimeout(600);
  const novo = col.locator(".conteudos-cartao", { hasText: TITULO });
  await novo.scrollIntoViewIfNeeded();
  await p.evaluate(() => scrollBy(0, 120));
  await marca();
  console.log(w, "cards edição antes/depois", antes, await col.locator(".conteudos-cartao").count(), "tem card:", await col.locator(".conteudos-titulo", { hasText: TITULO }).count());
  await p.screenshot({ path: join(REF, `79-card-criado-${w}.png`) });
  await p.close();
}
await nav.close();
