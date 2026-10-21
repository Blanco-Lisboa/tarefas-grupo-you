// Itens 249-252: fotos do mural de ideias antes (3471, build do commit anterior) e depois (3472), com a prova da rolagem.
// Precisa do banco-falso (provas/vitral-213/banco-falso.mjs, porta 3299) e dos dois apps no ar. Uso: node provas/r253/fotos.mjs
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
for (const [nome, porta] of [["depois", 3472]]) {
  for (const [w, h] of [[1903, 900], [1440, 760]]) {
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
      await p.locator('.mural-col').first().locator('.cab-coluna-novo').click();
      await p.waitForTimeout(300);
      console.log('foco no campo nova:', await p.evaluate(() => document.activeElement?.getAttribute('aria-label')));
      await p.screenshot({ path: join(PASTA, 'depois-1440-mais-clicado.png') });
    }
    if (erros.length) linhas.push(`${nome} ${w}: erros de página: ${erros.join(" | ")}`);
    await ctx.close();
  }
}
await nav.close();
import { writeFileSync } from "node:fs";
writeFileSync(join(PASTA, "rolagem.txt"), linhas.join("\n") + "\n");
console.log(linhas.join("\n"));
