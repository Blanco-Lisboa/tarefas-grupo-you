// Prova do item 188: reunião (título com "Reunião", qualquer variação) aparece no Calendário com a mesma cor e o brilho do menu,
// e não entra na Esteira nem no Mapa (linha e fila). Banco-falso DESTA pasta em 3299 + app em 3199. Logado como Natham.
// Uso: node provas/r25-reunioes/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const BASE = "http://127.0.0.1:3199";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000, uid = "u-natham";
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const REUNIOES = ["Reunião com a Beec: pauta de novembro", "reuniao de alinhamento"];
const CONTROLE = { conteudos: "Carrossel de impostos", mapa: "Dica rápida de IR", fila: "Carrossel de impostos" };
let falhou = false;
const marca = () => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); };
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  for (const tela of ["calendario", "conteudos", "mapa", "fila"]) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
    if (tela === "fila") await ctx.addInitScript(() => localStorage.setItem("grade:mapa-formato", "fila"));
    const p = await ctx.newPage();
    const erros = [];
    p.on("pageerror", (e) => erros.push(e.message));
    p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
    await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
    await p.goto(`${BASE}/${tela === "fila" ? "mapa" : tela}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1200);
    const texto = await p.locator("main").innerText();
    let ok, info;
    if (tela === "calendario") {
      const blocos = await p.locator(".evento-reuniao").evaluateAll((els) => els.map((e) => {
        const s = getComputedStyle(e);
        return { titulo: e.querySelector(".evento-titulo")?.textContent, fundo: s.backgroundImage + s.backgroundColor, animacao: s.animationName, etapa: !!e.querySelector(".etapa") };
      }));
      const titulos = blocos.map((b) => b.titulo).sort();
      const outros = await p.locator(".evento:not(.evento-reuniao)").count();
      ok = REUNIOES.every((r) => titulos.includes(r)) && blocos.length === 2 && new Set(blocos.map((b) => b.fundo)).size === 1
        && blocos.every((b) => b.animacao === "menu-brilho" && !b.etapa) && outros > 0;
      info = `reuniões: ${JSON.stringify(titulos)} | mesma cor: ${new Set(blocos.map((b) => b.fundo)).size === 1} | animação: ${blocos.map((b) => b.animacao)} | sem etapa: ${blocos.every((b) => !b.etapa)} | outros eventos: ${outros}`;
    } else {
      const achadas = REUNIOES.filter((r) => texto.includes(r));
      ok = !achadas.length && texto.includes(CONTROLE[tela]);
      info = `reuniões na tela: ${JSON.stringify(achadas)} | controle "${CONTROLE[tela]}": ${texto.includes(CONTROLE[tela])}`;
    }
    ok &&= !erros.length;
    if (!ok) falhou = true;
    console.log(ok ? "OK   " : "FALHA", w, tela.padEnd(10), "|", info, "| erros:", erros.length ? erros : "nenhum");
    await p.evaluate(marca);
    await p.screenshot({ path: join(PASTA, `${tela}-${w}.png`) });
    if (tela === "calendario") {
      const alvo = p.locator(".evento-reuniao").first();
      await alvo.scrollIntoViewIfNeeded();
      const c = await alvo.boundingBox(), mg = 24;
      if (c) await p.screenshot({ path: join(PASTA, `reuniao-zoom-${w}.png`), clip: { x: Math.max(0, c.x - mg), y: Math.max(0, c.y - mg), width: c.width + 2 * mg, height: c.height + 2 * mg } });
    }
    await ctx.close();
  }
}
await nav.close();
process.exit(falhou ? 1 : 0);
