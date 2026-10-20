// Prova do 5cb7c51 (item 177): Conteúdos, Mapa e Fila escondem a privada do Matheus para o Natham e mostram conteúdo com empresa.
// Banco-falso DESTA pasta em 3299 (3 privadas do Matheus sem empresa a mais) + app em 3199. Uso: node provas/r19-filtro-conteudos-mapa/fotos.mjs
// Matheus entra como controle: as privadas aparecem para ele, então a ausência no Natham é o filtro, não falta de dado.
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
const PRIVADAS = { conteudos: ["Privada do Matheus: roteiro sem empresa", "Privada do Matheus: postagem sem empresa", "Privada do Matheus: atrasada"], linha: ["Privada do Matheus: postagem sem empresa"], fila: ["Privada do Matheus: postagem sem empresa", "Privada do Matheus: atrasada"] };
const COM_EMPRESA = { conteudos: ["Post - Reels", "Carrossel: prazo do MEI", "Roteiro: 5 erros no MEI", "Vídeo institucional"], linha: ["Post - Reels", "Carrossel: prazo do MEI", "Dica rápida de IR"], fila: ["Carrossel de impostos", "Carrossel: prazo do MEI"] };
const SELETOR = { conteudos: ".conteudos-titulo", linha: ".mapa-objetivo", fila: ".eo-titulo" };
const marca = (p) => p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
let falhou = false;
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const rodadas = [["natham", "u-natham", 1903, 900], ["natham", "u-natham", 1440, 760], ["natham", "u-natham", 390, 844], ["matheus", "u-matheus", 1440, 760]];
for (const [quem, uid, w, h] of rodadas) {
  for (const tela of ["conteudos", "linha", "fila"]) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await ctx.addCookies([cookie(uid)]);
    await ctx.addInitScript((f) => localStorage.setItem("grade:mapa-formato", f), tela === "fila" ? "fila" : "linha");
    const p = await ctx.newPage();
    const erros = [];
    p.on("pageerror", (e) => erros.push(e.message));
    p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
    await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
    await p.goto(BASE + (tela === "conteudos" ? "/conteudos" : "/mapa"), { waitUntil: "networkidle" });
    await p.waitForTimeout(900);
    const lista = await p.locator(SELETOR[tela]).allTextContents().then((l) => l.map((s) => s.trim()));
    const vistas = PRIVADAS[tela].filter((x) => lista.includes(x));
    const faltam = COM_EMPRESA[tela].filter((x) => !lista.includes(x));
    // Natham: nenhuma privada e todas com empresa. Matheus (controle): todas as privadas e todas com empresa.
    const ok = faltam.length === 0 && (quem === "natham" ? vistas.length === 0 : vistas.length === PRIVADAS[tela].length) && !erros.length;
    if (!ok) falhou = true;
    console.log(ok ? "OK   " : "FALHA", quem, w, tela, "| privadas vistas:", JSON.stringify(vistas), "| com empresa faltando:", JSON.stringify(faltam), "| erros:", erros.length ? erros : "nenhum");
    console.log("      títulos:", JSON.stringify(lista));
    await marca(p);
    await p.screenshot({ path: join(PASTA, `${tela}-${quem}-${w}.png`) });
    // Card solto do Mapa: tem que continuar vidro escuro com a luz girando na borda (item 180b, c208a67)
    if (tela === "linha" && quem === "natham") {
      const card = p.locator(".mapa-pilha > .borda-animada").first();
      await card.scrollIntoViewIfNeeded();
      await p.waitForTimeout(400);
      const r = await card.evaluate((el) => {
        const m = getComputedStyle(el.querySelector(".mapa-card")), luz = el.querySelector(".borda-animada-luz"), l = luz && getComputedStyle(luz);
        return { fundo: m.backgroundColor, desfoque: m.backdropFilter, texto: m.color, luz: !!luz, animacao: l?.animationName, rodando: l?.animationPlayState, transform0: l?.transform };
      });
      await p.waitForTimeout(600);
      r.transform1 = await card.evaluate((el) => getComputedStyle(el.querySelector(".borda-animada-luz")).transform);
      const vidro = r.fundo === "rgba(16, 22, 40, 0.78)" && r.desfoque.includes("blur(14px)") && r.luz && r.animacao === "borda-animada-gira" && r.rodando === "running" && r.transform0 !== r.transform1;
      if (!vidro) falhou = true;
      console.log(vidro ? "OK   " : "FALHA", "card vidro+luz", w, JSON.stringify(r));
      const c = await card.boundingBox(), mg = 24;
      await p.screenshot({ path: join(PASTA, `card-vidro-${w}.png`), clip: { x: Math.max(0, c.x - mg), y: Math.max(0, c.y - mg), width: c.width + 2 * mg, height: c.height + 2 * mg } });
    }
    await ctx.close();
  }
}
await nav.close();
process.exit(falhou ? 1 : 0);
