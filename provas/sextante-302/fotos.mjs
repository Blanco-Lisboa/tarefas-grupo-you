// 302: card da Esteira com tag+clipe, só tag, só clipe, nenhum. Precisa de `npm run exemplo` no ar (3101). Uso: node fotos.mjs
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
const ANTES = ".conteudos-cartao-sombra[data-fazendo='true'] .conteudos-cartao-topo{display:flex!important}.conteudos-cartao-sombra[data-fazendo='true'] .conteudos-clipe{margin-top:0!important}.conteudos-fazendo{right:52px!important}";
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1903, 900], [1440, 760], [390, 800]]) {
  for (const fase of ["antes", "depois"]) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h } });
    await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
    const p = await ctx.newPage();
    await p.goto("http://127.0.0.1:3101/conteudos", { waitUntil: "networkidle" });
    await p.waitForTimeout(2000);
    // monta 4 cards de prova numa faixa fixa, clonando um card com rede
    const ok = await p.evaluate(({ fase, ANTES }) => {
      const base = [...document.querySelectorAll(".conteudos-cartao-sombra")].find((s) => s.querySelector(".conteudos-rede"));
      if (!base) return false;
      const faixa = document.createElement("div");
      faixa.style.cssText = "position:fixed;inset:0;z-index:9990;background:#f4f1ec;display:flex;flex-wrap:wrap;gap:24px;padding:40px 24px;align-content:flex-start";
      const variantes = [["tag + clipe", 1, 1], ["só tag", 1, 0], ["só clipe", 0, 1], ["nenhum", 0, 0]];
      for (const [nome, tag, clipe] of variantes) {
        const c = base.cloneNode(true);
        c.style.width = "340px"; c.style.flex = "none";
        c.removeAttribute("data-fazendo"); c.querySelector(".conteudos-fazendo")?.remove();
        if (tag) { c.setAttribute("data-fazendo", "true"); const f = document.createElement("span"); f.className = "conteudos-fazendo"; f.innerHTML = "<i style='width:26px;height:26px;border-radius:50%;background:#e9c7a8;display:block'></i>"; c.querySelector(".conteudos-cartao").prepend(f); }
        let cl = c.querySelector(".conteudos-clipe");
        if (clipe && !cl) { cl = document.createElement("span"); cl.className = "conteudos-clipe"; cl.textContent = "📎 1"; c.querySelector(".conteudos-rede").before(cl); }
        if (!clipe) cl?.remove();
        const r = document.createElement("small"); r.textContent = nome; r.style.cssText = "display:block;font:700 12px monospace;margin-bottom:4px"; c.prepend(r);
        faixa.append(c);
      }
      document.body.append(faixa);
      if (fase === "antes") { const s = document.createElement("style"); s.textContent = ANTES; document.head.append(s); }
      const e = document.createElement("div"); e.style.cssText = "position:fixed;top:0;right:0;z-index:99999;background:#000;color:#fff;font:14px monospace;padding:4px"; e.textContent = fase + " innerWidth=" + innerWidth; document.body.append(e);
      return true;
    }, { fase, ANTES });
    console.log(w, fase, ok);
    await p.screenshot({ path: join(PASTA, `${fase}-${w}.png`) });
    await ctx.close();
  }
}
await nav.close();
