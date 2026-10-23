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
const ANTES = '.conteudos-clipe{display:inline-flex!important;gap:3px!important;width:auto!important;padding:0 8px!important}';
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1440, 760]]) {
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
        if (clipe && !cl) { cl = document.createElement("span"); cl.className = "conteudos-clipe"; cl.innerHTML = "<svg viewBox=\"0 0 24 24\"><path d=\"M21 12.5l-8.5 8.5a5.5 5.5 0 01-7.8-7.8L13.2 4.7a3.7 3.7 0 015.2 5.2l-8.5 8.5a1.9 1.9 0 01-2.6-2.6L14.6 7.5\"/></svg>"; c.querySelector(".conteudos-rede").before(cl); }
        if (!clipe) cl?.remove();
        if (clipe && fase === 'antes') cl.insertAdjacentHTML('beforeend','1');
        const r = document.createElement("small"); r.textContent = nome; r.style.cssText = "display:block;font:700 12px monospace;margin-bottom:4px"; c.prepend(r);
        faixa.append(c);
      }
      document.body.append(faixa);
      if (fase === "antes") { const s = document.createElement("style"); s.textContent = ANTES; document.head.append(s); }
      const e = document.createElement("div"); e.style.cssText = "position:fixed;top:0;right:0;z-index:99999;background:#000;color:#fff;font:14px monospace;padding:4px"; e.textContent = fase + " innerWidth=" + innerWidth; document.body.append(e);
      return true;
    }, { fase, ANTES });
    console.log(w, fase, ok, await p.evaluate(() => [...document.querySelectorAll("[style*=\"width: 340px\"]")].map((c) => c.querySelector("small").textContent + "=" + Math.round(c.querySelector(".conteudos-cartao").getBoundingClientRect().height)).join(" | ")));
    console.log("medidas", fase, JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll("[style*=\"width: 340px\"]")].filter(c=>c.querySelector(".conteudos-clipe")).map(c=>{const m=e=>{const r=getComputedStyle(e),b=e.getBoundingClientRect();return [Math.round(b.width*10)/10,Math.round(b.height*10)/10,r.borderRadius].join("x")};return c.querySelector("small").textContent+": rede="+m(c.querySelector(".conteudos-rede"))+" clipe="+m(c.querySelector(".conteudos-clipe"))}))));
    await p.screenshot({ path: join(PASTA, `${fase}-${w}.png`) });
    await ctx.close();
  }
}
await nav.close();
