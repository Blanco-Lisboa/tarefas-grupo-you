// Itens 259-260: fotos antes/depois dos links do card. Uso: node fotos.mjs antes|depois. Precisa de npm run exemplo no ar.
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
const FASE = process.argv[2] || "antes";
const URLS = ["https://www.instagram.com/reel/aaa/", "https://www.tiktok.com/@x/video/1", "https://www.youtube.com/watch?v=abc", "https://www.instagram.com/p/bbb/", "https://www.instagram.com/p/ccc/", "https://www.tiktok.com/@y/video/2"];
for (const [w, h] of [[1440, 760], [1903, 900]]) {
  const p = await abrir(w, h);
  const cards = p.locator(".mural-folha:not(.mural-nova)");
  const poe = async (card, n) => {
    for (let k = 0; k < n; k++) {
      if (!(await card.locator(".mural-link-campo").count())) await card.locator(".mural-mais").click();
      await card.locator(".mural-link-campo").fill(URLS[k]);
      await card.locator(".mural-link-campo").press("Enter");
      await p.waitForTimeout(250);
    }
  };
  // 4 cards diferentes: 1, 3, 6 links e sem link (o 4o fica como está)
  await poe(cards.nth(0), 1); await poe(cards.nth(1), 3); await poe(cards.nth(2), 6);
  for (const [i, nome] of [[0, "1-link"], [1, "3-links"], [2, "6-links"], [3, "sem-link"]]) {
    await cards.nth(i).scrollIntoViewIfNeeded();
    await p.waitForTimeout(200);
    await foto(p, `${FASE}-${nome}`, w);
  }
  // confirmação aberta (só existe depois)
  if (FASE === "depois") {
    await cards.nth(1).scrollIntoViewIfNeeded();
    await cards.nth(1).locator(".mural-ref").nth(1).hover();
    await cards.nth(1).locator(".mural-ref button").nth(1).click();
    await p.waitForTimeout(300);
    await foto(p, "depois-confirmacao", w);
  }
  await p.close();
}
await nav.close();
