// Item 189: pilha do Mapa de verdade com a aparência da variação 1. Banco-falso desta pasta em 3299 + app em 3199. Uso: node provas/r27-mapa-pilha/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000, uid = "u-natham";
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
let falhou = false;
const confere = (ok, msg) => { if (!ok) falhou = true; console.log(ok ? "OK   " : "FALHA", msg); };
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const ctx = await nav.newContext({ viewport: { width: 1440, height: 760 }, deviceScaleFactor: 2 });
await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
await ctx.addInitScript(() => localStorage.setItem("grade:mapa-formato", "linha"));
const p = await ctx.newPage();
const erros = [];
p.on("pageerror", (e) => erros.push(e.message));
p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
await p.goto("http://127.0.0.1:3199/mapa", { waitUntil: "networkidle" }); await p.waitForTimeout(1200);
await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
await p.screenshot({ path: join(PASTA, "mapa-1440.png") });
const texto = await p.locator("main").innerText();
confere(!texto.includes("Reunião do dia 28") && !texto.includes("Tarefa do caderno do dia 28"), "reunião e tarefa do caderno fora do Mapa");
async function marco(dia, arq) {
  const m = p.locator(`.mapa-marco[data-dia="${dia}"]`);
  // o texto do dia entra com a rolagem (animação do Mapa): rola até o dia aparecer inteiro
  for (let y = 0; y <= 6000; y += 150) { await p.mouse.wheel(0, 150); await p.waitForTimeout(40); const b = await m.boundingBox(); if (b && b.x > 120 && b.x < 600) break; }
  await p.waitForTimeout(1500);
  const info = await m.evaluate((el) => {
    const f = [...el.querySelectorAll(".mapa-pilha > .borda-animada")];
    return {
      titulos: f.map((x) => x.querySelector(".mapa-objetivo").textContent),
      contagem: f.map((x) => x.querySelector(".mapa-folha-contagem")?.textContent ?? null),
      luz: f.map((x) => getComputedStyle(x.querySelector(".borda-animada-luz")).display !== "none"),
      vidro: f.every((x) => getComputedStyle(x.querySelector(".mapa-card")).backdropFilter.includes("blur(10px)")),
      giro: f.map((x) => getComputedStyle(x).transform !== "none"),
      altura: f.map((x) => Math.round(x.getBoundingClientRect().height)),
      rolagem: getComputedStyle(el.querySelector(".mapa-bloco")).overflowY,
    };
  });
  console.log(dia, JSON.stringify(info));
  const b = await m.locator(".mapa-bloco").boundingBox();
  await p.screenshot({ path: join(PASTA, arq), clip: { x: Math.max(0, b.x), y: Math.max(0, b.y), width: Math.min(b.width, 1440 - b.x), height: b.height } });
  return { info, b };
}
const pilha = await marco("2026-10-28", "pilha-4-1440.png");
const solo = await marco("2026-10-22", "solo-1440.png");
confere(pilha.info.titulos.length === 4 && pilha.info.contagem.join() === "1/4,2/4,3/4,4/4", "dia com 4: 4 folhas e contador 1/4..4/4");
confere(pilha.info.luz.join() === "false,false,false,true", "luz só na folha da frente");
confere(pilha.info.vidro && pilha.info.giro.slice(0, 3).every(Boolean) && pilha.info.rolagem === "auto", "vidro em todas, folhas giradas, rolagem mantida");
confere(solo.info.titulos.length === 1 && solo.info.luz.join() === "true" && solo.info.contagem[0] === null, "dia com 1: card solto como antes (luz, sem contador)");
// leque abre ao passar o mouse
const m28 = p.locator('.mapa-marco[data-dia="2026-10-28"] .mapa-pilha');
await m28.hover(); await p.waitForTimeout(700);
const abertas = await m28.evaluate((el) => [...el.querySelectorAll(".mapa-card")].map((c) => Math.round(c.getBoundingClientRect().height)));
confere(abertas.every((h) => h >= 60), "passar o mouse abre o leque: " + abertas);
await p.mouse.move(5, 5); await p.waitForTimeout(500);
confere(!erros.length, "sem erros no console: " + (erros.join("|") || "nenhum"));
// lado a lado: variação 1 (protótipo apagado, foto salva do commit d9d3960) x Mapa real
const proto = readFileSync(join(PASTA, "prototipo-variacao-1-1440-pagina.png")).toString("base64");
const real = readFileSync(join(PASTA, "pilha-4-1440.png")).toString("base64");
const q = await ctx.newPage();
await q.setViewportSize({ width: 1100, height: 420 });
await q.setContent(`<body style="margin:0;background:#fff;font:600 13px sans-serif;display:flex;gap:24px;padding:16px">
<div><div style="margin-bottom:8px">Variação 1 (protótipo, escolhida)</div><div style="width:480px;height:240px;overflow:hidden;background:url(data:image/png;base64,${proto}) -719px -305px/1440px auto no-repeat;border:1px solid #ccc"></div></div>
<div><div style="margin-bottom:8px">Mapa real (dia 28/10, 4 conteúdos)</div><img style="height:240px;border:1px solid #ccc;background:#eef" src="data:image/png;base64,${real}"></div></body>`);
await q.screenshot({ path: join(PASTA, "lado-a-lado-variacao1-x-mapa-real.png") });
await nav.close();
process.exit(falhou ? 1 : 0);
