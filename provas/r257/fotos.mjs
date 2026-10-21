// Item 257: fotos do mural com vários links por ideia. Precisa de `npm run exemplo` no ar (3101 + banco falso 3201).
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
const ctx = await nav.newContext({ viewport: { width: 1440, height: 760 } });
await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
const marca = (p) => p.evaluate(() => { document.querySelector("#marca-w")?.remove(); const d = document.createElement("div"); d.id = "marca-w"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
const abrir = async (w, h) => {
  const p = await ctx.newPage();
  await p.setViewportSize({ width: w, height: h });
  await p.goto("http://127.0.0.1:3101/pastas", { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await p.locator(".pastas-cel", { hasText: "Ideias de conteúdo" }).locator(".gf-hit").first().click();
  await p.waitForSelector("dialog.mural[open]");
  await p.waitForTimeout(600);
  return p;
};
const foto = async (p, nome, w) => { await marca(p); await p.screenshot({ path: join(PASTA, `${nome}-${w}.png`) }); };
const p = await abrir(1440, 760);
const card = p.locator("section[aria-label=\"Ganchos\"] .mural-folha").first();
await card.scrollIntoViewIfNeeded();
const poe = async (url) => {
  const campo = card.locator(".mural-link-campo");
  if (!(await campo.count())) await card.getByRole("button", { name: "+ link" }).click();
  await card.locator(".mural-link-campo").fill(url);
  await card.locator(".mural-link-campo").press("Enter");
  await p.waitForTimeout(300);
};
await poe("https://www.instagram.com/reel/aaa/");
await poe("https://www.tiktok.com/@x/video/1");
await foto(p, "1-dois-links", 1440);
await poe("https://www.youtube.com/watch?v=abc");
await foto(p, "2-tres-links", 1440);
await card.getByRole("button", { name: "+ link" }).click();
await card.locator(".mural-link-campo").hover();
await foto(p, "3-acrescentando", 1440);
await card.locator(".mural-detalhe").click(); await p.waitForTimeout(300);
await card.locator(".mural-ref").nth(1).hover();
await card.locator(".mural-ref").nth(1).getByRole("button").click(); // tira o do TikTok
await p.waitForTimeout(400);
await foto(p, "4-tirou-um", 1440);
const banco = await (await fetch("http://127.0.0.1:3201/rest/v1/ideias?categoria=eq.Ganchos&empresa_id=eq.you")).json();
console.log(JSON.stringify(banco.map((l) => ({ link: l.link, links: l.links }))));
await p.close();
for (const [w, h] of [[1903, 900], [390, 844]]) {
  const q = await abrir(w, h);
  await q.locator("section[aria-label=\"Ganchos\"] .mural-folha").first().scrollIntoViewIfNeeded();
  await foto(q, "5-tres-links", w);
  await q.close();
}
await nav.close();
