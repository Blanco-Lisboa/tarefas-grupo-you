// 229 etapa 2: tela Pastas no formato novo em 1440. App de exemplo em 3101 (banco falso, árvore pronta).
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000, uid = "u-natham";
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
const p = await ctx.newPage();
const marca = () => p.evaluate(() => { document.getElementById("iw")?.remove(); const d = document.createElement("div"); d.id = "iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
const foto = async (arq) => { await marca(); await p.screenshot({ path: join(PASTA, arq) }); };
// o banco de exemplo responde na hora; o envio demora 6 s para a barra de progresso aparecer na foto
await p.route("**/upload/**", async (r) => { await new Promise((x) => setTimeout(x, 6000)); await r.continue(); });
await p.goto("http://127.0.0.1:3101/pastas", { waitUntil: "networkidle" });
await p.waitForTimeout(3500);
await foto("tela-inteira-1440.png");
const youTemas = p.locator(".pastas-empresa").first().locator(".pastas-temas");
console.log("temas:", await youTemas.locator(".gf-label").allInnerTexts());
// um Formato aberto
await p.locator(".pastas-empresa").first().locator(".pastas-grade").first().locator(".gf-hit").first().click();
await p.mouse.move(5, 5);
await p.waitForTimeout(1600);
await foto("formato-aberto-1440.png");
await p.keyboard.press("Escape");
// tema permanente com cadeado, aberto
const lock = p.locator(".pastas-empresa").first().locator(".pastas-temas .pasta-cadeado").first();
console.log("cadeados:", await p.locator(".pasta-cadeado").count());
await lock.scrollIntoViewIfNeeded();
await lock.locator("xpath=ancestor::div[contains(@class,'pastas-cel')]").locator(".gf-hit").click();
await p.mouse.move(5, 5);
await p.waitForTimeout(1600);
await foto("tema-permanente-1440.png");
// subir documento
await lock.locator("xpath=ancestor::div[contains(@class,'pastas-cel')]").locator("xpath=following::button[contains(.,'Subir documento')][1]").click().catch(async () => { await p.getByRole("button", { name: "+ Subir documento" }).first().click(); });
await p.waitForTimeout(600);
await p.locator("dialog input[type=file]").setInputFiles({ name: "briefing-novo.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(20_000_000, 1) });
await p.waitForTimeout(1500);
await foto("subir-documento-1440.png");
await p.waitForTimeout(9000);
await foto("subir-documento-feito-1440.png");
await nav.close();
