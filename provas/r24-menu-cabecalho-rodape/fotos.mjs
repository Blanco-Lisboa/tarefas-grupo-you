// Itens 186 e 187: cabeçalho de vidro e cartão de perfil do menu. Banco-falso em 3299 + app em 3199. Uso: node provas/r24-menu-cabecalho-rodape/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const BASE = "http://127.0.0.1:3199";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const cookie = (uid) => {
  const exp = 1893456000;
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  return { name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" };
};
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
let falhou = false;
for (const [quem, uid, nome] of [["natham", "u-natham", "Natham"], ["matheus", "u-matheus", "Matheus"]]) {
  for (const [w, h] of [[1440, 760], [390, 800]]) {
    for (const recolhido of [false, true]) {
      if (w === 390 && recolhido) continue;
      const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
      await ctx.addCookies([cookie(uid)]);
      await ctx.addInitScript((r) => r && localStorage.setItem("grade:menu-recolhido", "1"), recolhido);
      const p = await ctx.newPage();
      await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
      await p.goto(BASE + "/tarefas", { waitUntil: "networkidle" });
      await p.waitForTimeout(800);
      if (recolhido && (await p.locator("html").getAttribute("data-menu")) !== "recolhido") await p.getByRole("button", { name: "Recolher menu" }).click();
      await p.waitForTimeout(500);
      const m = await p.evaluate(() => {
        const c = (e) => { const r = e.getBoundingClientRect(); return Math.round((r.left + r.width / 2) * 10) / 10; };
        const q = (s) => document.querySelector(s);
        const marca = q(".menu-marca").getBoundingClientRect(), menu = q(".menu").getBoundingClientRect();
        return { icone: c(q(".menu-lista .menu-icone")), foto: c(q(".menu-pessoa .pessoa")), logo: c(q(".menu-logo")), nome: q(".menu-pessoa-nome")?.textContent, cfg: c(q(".menu-perfil .menu-icone")), recolher: c(q(".menu-alterna .menu-icone")),
          cabecalhoLargo: Math.abs(marca.width - menu.width) <= 1, quadro: getComputedStyle(q(".menu-logo").parentElement).backgroundColor, estoura: [...q(".menu").querySelectorAll("*")].some((e) => getComputedStyle(e).opacity !== "0" && e.getBoundingClientRect().width && e.getBoundingClientRect().right > menu.right + 0.5 && !e.closest(".menu-nome,.menu-rotulo")), iw: innerWidth, centroMenu: menu.width / 2 };
      });
      const alinhado = (w === 390 ? [m.foto, m.cfg] : [m.foto, m.cfg, m.recolher]).every((x) => Math.abs(x - m.icone) <= 1) && m.cabecalhoLargo && !m.estoura && (recolhido || w === 390 ? Math.abs(m.logo - m.centroMenu) <= 1 : true);
      const ok = alinhado && m.nome === nome;
      if (!ok) falhou = true;
      console.log(ok ? "OK   " : "FALHA", quem, w, recolhido ? "recolhido" : "aberto", JSON.stringify(m));
      await p.locator(".menu").screenshot({ path: join(PASTA, `menu-${quem}-${w}${recolhido ? "-recolhido" : ""}.png`) });
      await ctx.close();
    }
  }
}
await nav.close();
process.exit(falhou ? 1 : 0);
