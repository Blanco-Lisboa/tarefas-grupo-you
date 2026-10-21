// Itens 249-252: fotos do mural de ideias antes (3471, build do commit anterior) e depois (3472), com a prova da rolagem.
// Precisa do banco-falso (provas/vitral-213/banco-falso.mjs, porta 3299) e dos dois apps no ar. Uso: node provas/r249-252/fotos.mjs
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
const marca = (p) => p.evaluate(() => { document.getElementById("marca-iw")?.remove(); const d = document.createElement("div"); d.id = "marca-iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
const linhas = [];
for (const [nome, porta] of [["antes", 3471], ["depois", 3472]]) {
  for (const [w, h] of [[1903, 900], [1440, 760], [390, 800]]) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
    const p = await ctx.newPage();
    const erros = [];
    p.on("pageerror", (e) => erros.push(e.message));
    await p.goto(`http://127.0.0.1:${porta}/pastas`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1200);
    await p.locator(".pastas-cel", { hasText: "Ideias de conteúdo" }).locator(".gf-hit").first().click();
    await p.waitForSelector("dialog.mural[open]");
    await p.waitForTimeout(900);
    await marca(p);
    await p.screenshot({ path: join(PASTA, `${nome}-${w}-mural.png`) });
    if (w === 1440) {
      // card em hover, card editando, card com e sem link
      const col = p.locator(".mural-col").first();
      const folha = col.locator(".mural-folha:not(.mural-nova)");
      await folha.nth(0).hover();
      await p.waitForTimeout(400);
      await col.screenshot({ path: join(PASTA, `${nome}-${w}-card-hover-com-link.png`) });
      const segunda = p.locator(".mural-col").nth(1).locator(".mural-folha:not(.mural-nova)").first(); // sem link na semente
      await segunda.hover();
      await p.waitForTimeout(400);
      await p.locator(".mural-col").nth(1).screenshot({ path: join(PASTA, `${nome}-${w}-card-sem-link.png`) });
      await folha.nth(1).locator("textarea.mural-detalhe").click();
      await p.waitForTimeout(400);
      await col.screenshot({ path: join(PASTA, `${nome}-${w}-card-editando.png`) });
      await p.keyboard.press("Tab");
      // prova da rolagem: mouse sobre o mural e sobre o fundo escurecido
      const rola = await p.evaluate(() => ({ y: scrollY, sh: document.documentElement.scrollHeight, ih: innerHeight }));
      await p.mouse.move(w / 2, h / 2);
      await p.mouse.wheel(0, 900);
      await p.waitForTimeout(500);
      const dentro = await p.evaluate(() => scrollY);
      await p.mouse.move(6, 6);
      await p.mouse.wheel(0, 900);
      await p.waitForTimeout(500);
      const fora = await p.evaluate(() => scrollY);
      linhas.push(`${nome} ${w}x${h}: scrollHeight ${rola.sh} innerHeight ${rola.ih} | scrollY antes ${rola.y} | depois de rolar sobre o mural ${dentro} | depois de rolar no fundo ${fora}`);
    }
    if (erros.length) linhas.push(`${nome} ${w}: erros de página: ${erros.join(" | ")}`);
    await ctx.close();
  }
}
await nav.close();
import { writeFileSync } from "node:fs";
writeFileSync(join(PASTA, "rolagem.txt"), linhas.join("\n") + "\n");
console.log(linhas.join("\n"));
