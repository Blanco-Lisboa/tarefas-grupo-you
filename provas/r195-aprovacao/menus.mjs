// Menus da ficha com fundo cheio (pedido da Régua, foto 194-tipo-1440). Mesmo banco falso e app do fotos.mjs. Uso: node provas/r195-aprovacao/menus.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const exp = 1893456000;
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: "u-natham", exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: "u-natham", aud: "authenticated", role: "authenticated", email: "natham@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 760 }, deviceScaleFactor: 1 });
await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
const pagina = await contexto.newPage();
await pagina.goto("http://127.0.0.1:3195/conteudos", { waitUntil: "networkidle" });
await pagina.getByRole("button", { name: "Novo conteúdo em Gravação" }).click();
const ficha = pagina.locator(".ficha-cartao");
await ficha.waitFor();
let falhas = 0;
for (const menu of ["Tipo", "Empresa", "Rede", "Etapa", "Tags"]) {
  await ficha.locator(".selecao-botao").filter({ hasText: menu }).first().click();
  const lista = pagina.locator(".selecao-pop:popover-open .selecao-lista");
  await lista.waitFor();
  await pagina.waitForTimeout(300);
  const { fundo, filtro } = await lista.evaluate((el) => { const c = getComputedStyle(el); return { fundo: c.backgroundColor, filtro: c.backdropFilter }; });
  const ok = /^rgb\(/.test(fundo) && filtro === "none"; // rgb() sem alfa = cheio
  if (!ok) falhas++;
  console.log(`${ok ? "OK" : "FALHA"} ${menu}: fundo ${fundo}, desfoque ${filtro}`);
  await pagina.evaluate(() => {
    document.querySelector("#marca-largura")?.remove();
    const d = document.createElement("div");
    d.id = "marca-largura";
    d.textContent = `innerWidth ${innerWidth}`;
    d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
    document.querySelector("dialog")?.append(d);
  });
  await pagina.screenshot({ path: join(pasta, `menu-${menu.toLowerCase()}-1440.png`) });
  await pagina.keyboard.press("Escape");
  await pagina.waitForTimeout(150);
}
await navegador.close();
process.exit(falhas ? 1 : 0);
