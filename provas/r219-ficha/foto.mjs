// Item 219 (Sextante): Consertar e Aprovar no fim da ficha, depois de Notas, acima do pé. Consertar à esquerda, Aprovar à direita.
// Mesma prévia do r208 (banco falso do 196 em 3497 com PREVIA=1; app em 3297 apontando para ele):
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3497 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=falsa next dev --webpack -p 3297
// Uso: node provas/r219-ficha/foto.mjs
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const banco = spawn(process.execPath, [fileURLToPath(new URL("../r196-postagem/banco-falso.mjs", import.meta.url))], { stdio: ["ignore", "pipe", "inherit"], env: { ...process.env, PREVIA: "1", PORTA: "3497" } });
await new Promise((ok) => banco.stdout.on("data", (d) => { if (String(d).includes("banco falso em")) ok(); }));
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: "u-natham", exp: 1893456000, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: 1893456000, token_type: "bearer", user: { id: "u-natham", aud: "authenticated", role: "authenticated", email: "natham@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 760 } });
await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
const pg = await contexto.newPage();
await pg.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
await pg.goto("http://127.0.0.1:3297/conteudos", { waitUntil: "networkidle" });
await pg.locator(".conteudos-cartao").first().waitFor();
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };

await pg.locator(".conteudos-cartao").filter({ hasText: "Reels: bastidores do escritório" }).locator(".conteudos-titulo").click();
const ficha = pg.locator(".ficha-cartao");
await ficha.waitFor();
await pg.waitForTimeout(400);
const topo = ficha.locator(".ficha-faixa-topo");
confere(await topo.getByRole("button", { name: "Aprovar" }).count() === 0 && await topo.getByRole("button", { name: "Consertar" }).count() === 0, "219: topo sem Aprovar/Consertar");
confere(await topo.getByRole("button", { name: "Começar" }).count() === 1 && await topo.getByRole("button", { name: "Fechar" }).count() === 1, "219: Começar e Fechar continuam no topo");

await pg.locator(".ficha-corpo").evaluate((c) => { c.scrollTop = c.scrollHeight; });
await pg.waitForTimeout(300);
const m = await ficha.evaluate((f) => {
  const r = (s) => f.querySelector(s).getBoundingClientRect();
  const corpo = f.querySelector(".ficha-corpo");
  return { consertar: r("[data-acao=consertar]"), aprovar: r("[data-acao=aprovar]"), notas: r("#ficha-notas, .ficha-notas-ver"), pe: r(".ficha-pe"),
    ultimo: corpo.lastElementChild.className, rolado: corpo.scrollTop >= corpo.scrollHeight - corpo.clientHeight - 1 };
});
console.log("   medidas:", JSON.stringify({ consertar: [m.consertar.left, m.consertar.right, m.consertar.width], aprovar: [m.aprovar.left, m.aprovar.right, m.aprovar.width], notas: [m.notas.left, m.notas.right] }));
confere(m.ultimo === "ficha-decidir" && m.consertar.top > m.notas.bottom && m.aprovar.bottom <= m.pe.top, "219: os dois depois de Notas, último item da área rolável, acima do pé");
confere(m.consertar.right < m.aprovar.left && Math.abs(m.consertar.top - m.aprovar.top) < 1, "219: Consertar à esquerda, Aprovar à direita, na mesma linha");
confere(Math.abs(m.consertar.width - m.aprovar.width) < 1, "219: larguras iguais");
confere(Math.round(m.consertar.left) === Math.round(m.notas.left) && Math.round(m.aprovar.right) === Math.round(m.notas.right), "219: alinhados às bordas dos campos");
confere(m.rolado, "219: ficha rolada até o fim");
await pg.evaluate(() => {
  const d = Object.assign(document.createElement("div"), { textContent: `innerWidth ${innerWidth}` });
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
  document.body.append(d);
});
await pg.screenshot({ path: join(pasta, "219-ficha-em-analise-fim-1440.png") });
await contexto.close();
await navegador.close();
banco.kill();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(falhas ? 1 : 0);
