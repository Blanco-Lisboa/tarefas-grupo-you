// 234: pastas livres na tela Pastas, em 1440. App de exemplo em 3101 (banco falso com "Logos e marca" com cadeado e "Referências").
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000, uid = "u-natham";
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("a")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "f@e.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
const p = await ctx.newPage();
const marca = () => p.evaluate(() => { document.getElementById("iw")?.remove(); const d = document.createElement("div"); d.id = "iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
const foto = async (arq) => { await marca(); await p.screenshot({ path: join(PASTA, arq) }); };
await p.goto("http://127.0.0.1:3101/pastas", { waitUntil: "networkidle" });
await p.waitForTimeout(3500);
const you = p.locator(".pastas-empresa").first();
const celula = (nome) => you.locator(".pastas-grade").first().locator(".pastas-cel", { hasText: nome });
await foto("fileira-1440.png");
// modal Nova pasta
await you.getByRole("button", { name: "+ Nova pasta" }).click();
await p.waitForTimeout(700);
await p.locator("dialog input[name=nome]").fill("Contratos");
await p.locator("dialog .pasta-trilho").click();
await foto("nova-pasta-1440.png");
await p.keyboard.press("Escape");
await p.waitForTimeout(400);
// pasta livre aberta
await celula("Referências").locator(".gf-hit").click();
await p.mouse.move(5, 5);
await p.waitForTimeout(1600);
await foto("pasta-livre-aberta-1440.png");
await p.keyboard.press("Escape");
await p.waitForTimeout(500);
// ⋮ da pasta livre
await celula("Referências").hover();
await celula("Referências").locator(".gf-pontos").click();
await p.mouse.move(700, 600);
await p.waitForTimeout(500);
await foto("menu-1440.png");
await p.keyboard.press("Escape");
await p.waitForTimeout(400);
// apagar com cadeado
await celula("Logos e marca").hover();
await celula("Logos e marca").locator(".gf-pontos").click();
await p.waitForTimeout(400);
await p.getByRole("button", { name: "Apagar pasta" }).click();
await p.waitForTimeout(700);
await foto("apagar-com-cadeado-1440.png");
await nav.close();
